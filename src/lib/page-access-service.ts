import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@/generated/prisma/client";
import { getAppRole, type AppRoleId } from "@/components/auth/role-config";
import { generateMemberEmail } from "@/components/members/member-data";
import { initialAccountPassword } from "@/lib/account-credentials";
import { writeAuditLog, writeAuditLogs } from "@/lib/audit-log-service";
import { prisma } from "@/lib/prisma";
import {
  accessManagedRoles,
  getDefaultPositionPageAccess,
  getDefaultRolePageAccess,
  isOfficerPositionKey,
  isPageAccessKey,
  officerPositions,
  pageAccessPages,
  type OfficerPositionKey,
  type PageAccessKey,
} from "@/lib/page-access-config";

type AccessChange =
  | { scope: "role"; target: AppRoleId; page: PageAccessKey; enabled: boolean }
  | {
      scope: "position";
      target: OfficerPositionKey;
      page: PageAccessKey;
      enabled: boolean;
    };

export type OfficerAssignmentImportInput = {
  rowNumber: number;
  nim: string;
  name: string;
  cohort: string | null;
  position: string;
  division: string;
};

export type OfficerAssignmentImportIssue = {
  row: number;
  message: string;
};

export type OfficerAssignmentImportRow = {
  rowNumber: number;
  memberId: string;
  memberCode: string;
  cohort: string | null;
  memberAction: "existing" | "create";
  membershipDivision: string;
  membershipAction: "existing" | "create";
  accountUserId: string | null;
  nim: string;
  name: string;
  position: OfficerPositionKey;
  positionLabel: string;
  division: string | null;
  accountEmail: string;
  accountAction: "existing" | "create" | "activate" | "same-file";
};

export type OfficerAssignmentImportCredential = {
  id: string;
  name: string;
  nim: string;
  email: string;
  initialPassword: string;
};

type AssignmentImportDb = Pick<
  Prisma.TransactionClient,
  "period" | "member" | "membership" | "officerAssignment" | "division" | "user"
>;

type ImportMemberCandidate = {
  id: string;
  nim: string;
  fullName: string;
  memberCode: string;
  cohort: string | null;
  userId: string | null;
  user: { email: string; isActive: boolean } | null;
  memberships: {
    division: string;
    status: "ACTIVE" | "ON_LEAVE" | "EXITED" | "ALUMNI";
  }[];
};

function normalizeImportValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeImportName(value: string) {
  return value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("id");
}

function createUniqueMemberEmail(
  name: string,
  division: string,
  periodName: string,
  usedEmails: Set<string>,
) {
  const baseEmail = generateMemberEmail(name, division, periodName);
  if (!baseEmail) return null;

  const [localPart, domain] = baseEmail.split("@");
  let email = baseEmail;
  let suffix = 2;
  while (usedEmails.has(email.toLowerCase())) {
    email = `${localPart}_${suffix}@${domain}`;
    suffix += 1;
  }
  usedEmails.add(email.toLowerCase());
  return email;
}

async function inspectOfficerAssignmentImport(
  database: AssignmentImportDb,
  periodId: string,
  inputs: OfficerAssignmentImportInput[],
) {
  const period = await database.period.findUnique({
    where: { id: periodId },
    select: { id: true, name: true, startDate: true },
  });
  if (!period) throw new Error("Periode tujuan tidak ditemukan.");

  const [members, existingAssignments, activeDivisions, users, memberCodes] = await Promise.all([
    database.member.findMany({
      where: { nim: { in: [...new Set(inputs.map(({ nim }) => nim).filter(Boolean))] } },
      select: {
        id: true,
        nim: true,
        fullName: true,
        memberCode: true,
        cohort: true,
        userId: true,
        user: { select: { email: true, isActive: true } },
        memberships: {
          where: { periodId },
          select: { division: true, status: true },
          take: 1,
        },
      },
    }),
    database.officerAssignment.findMany({
      where: { periodId },
      select: { memberId: true, position: true, division: true },
    }),
    database.division.findMany({
      where: { isActive: true },
      select: { name: true },
    }),
    database.user.findMany({ select: { email: true } }),
    database.member.findMany({
      where: { memberCode: { startsWith: `RTX-${period.startDate.getUTCFullYear()}-` } },
      select: { memberCode: true },
    }),
  ]);
  let nextMemberSerial =
    memberCodes.reduce((largest, { memberCode }) => {
      const serial = Number(memberCode.split("-").at(-1));
      return Number.isInteger(serial) ? Math.max(largest, serial) : largest;
    }, 0) + 1;
  const memberByNim = new Map<string, ImportMemberCandidate>(
    members.map((member) => [member.nim, member]),
  );
  const usedEmails = new Set(users.map(({ email }) => email.toLowerCase()));
  const sameFileAccounts = new Map<string, string>();
  const positionByLabel = new Map([
    ...officerPositions.flatMap((position) => [
      [normalizeImportValue(position.key), position] as const,
      [normalizeImportValue(position.label), position] as const,
    ]),
    [normalizeImportValue("Penanggung Jawab Divisi"), officerPositions.find(({ key }) => key === "pj-divisi")!],
  ]);
  const divisionByName = new Map(
    activeDivisions.flatMap((division) => [
      [normalizeImportValue(division.name), division.name] as const,
      ...(division.name === "Programing"
        ? [[normalizeImportValue("Programming"), division.name] as const]
        : []),
      ...(division.name === "Manufacture & Mechanical"
        ? [[normalizeImportValue("Manufaktur & Mechanical"), division.name] as const]
        : []),
    ]),
  );
  const existingMemberPositions = new Set(
    existingAssignments.map(({ memberId, position }) => `${memberId}:${position}`),
  );
  const occupiedSlots = new Set(
    existingAssignments.flatMap(({ position, division }) =>
      position === "ketua-umum" ||
      position === "ketua-divisi" ||
      position === "pj-divisi"
        ? [`${position}:${division ?? ""}`]
        : [],
    ),
  );
  const memberDivisionAssignments = new Map<string, Set<string>>();
  for (const assignment of existingAssignments) {
    if (
      (assignment.position === "ketua-divisi" || assignment.position === "pj-divisi") &&
      assignment.division
    ) {
      const divisions = memberDivisionAssignments.get(assignment.memberId) ?? new Set();
      divisions.add(assignment.division);
      memberDivisionAssignments.set(assignment.memberId, divisions);
    }
  }

  const issues: OfficerAssignmentImportIssue[] = [];
  const rows: OfficerAssignmentImportRow[] = [];
  const seenMemberPositions = new Set<string>();
  const seenSlots = new Set<string>();
  const newMembersByNim = new Map<string, ImportMemberCandidate>();

  for (const input of inputs) {
    const rowIssues: string[] = [];
    const nim = input.nim.trim();
    const name = input.name.trim();
    const cohort = input.cohort?.trim() || null;
    const rawPosition = input.position.trim();
    const position = positionByLabel.get(normalizeImportValue(rawPosition));
    const rawDivision = input.division.trim();

    if (!nim) rowIssues.push("NIM wajib diisi.");
    if (name.length < 2 || name.length > 160) {
      rowIssues.push("Nama harus terdiri dari 2–160 karakter.");
    }
    if (!rawPosition) rowIssues.push("Jabatan wajib diisi.");
    if (rawPosition && !position) rowIssues.push(`Jabatan "${rawPosition}" tidak dikenal.`);

    if (cohort && !/^\d{4}$/.test(cohort)) {
      rowIssues.push("Angkatan harus kosong atau berupa tahun 4 digit.");
    }

    let member = memberByNim.get(nim) ?? newMembersByNim.get(nim);
    if (nim && !member) {
      if (name.length >= 2 && name.length <= 160) {
        member = {
          id: randomUUID(),
          memberCode: `RTX-${period.startDate.getUTCFullYear()}-${String(nextMemberSerial).padStart(3, "0")}`,
          fullName: name,
          nim,
          cohort,
          userId: null,
          user: null,
          memberships: [],
        };
        nextMemberSerial += 1;
        newMembersByNim.set(nim, member);
      }
    }
    if (member && name && normalizeImportName(name) !== normalizeImportName(member.fullName)) {
      rowIssues.push(`Nama tidak cocok dengan data anggota untuk NIM ${nim}.`);
    }
    if (member && cohort && member.cohort && cohort !== member.cohort) {
      rowIssues.push(
        `Angkatan ${member.cohort} pada data anggota berbeda dari Angkatan ${cohort} di file.`,
      );
    }
    if (member?.memberships[0] && member.memberships[0].status !== "ACTIVE") {
      rowIssues.push("Keanggotaan periode ini belum berstatus Aktif.");
    }

    let division: string | null = null;
    let membershipDivision = member?.memberships[0]?.division ?? "Organisasi";
    if (position) {
      const positionConfig = officerPositions.find(({ key }) => key === position.key);
      if (positionConfig?.requiresDivision) {
        division = divisionByName.get(normalizeImportValue(rawDivision)) ?? null;
        if (!rawDivision) {
          rowIssues.push("Divisi wajib diisi untuk jabatan ini.");
        } else if (!division) {
          rowIssues.push(`Divisi "${rawDivision}" tidak ditemukan atau tidak aktif.`);
        } else if (!member?.memberships[0]) {
          membershipDivision = division;
        }
      } else if (rawDivision) {
        rowIssues.push("Kolom Divisi harus kosong untuk jabatan ini.");
      }
    }

    if (member && position) {
      const memberPositionKey = `${member.id}:${position.key}`;
      if (existingMemberPositions.has(memberPositionKey)) {
        rowIssues.push("Anggota ini sudah memiliki jabatan tersebut pada periode ini.");
      }
      if (seenMemberPositions.has(memberPositionKey)) {
        rowIssues.push("Jabatan yang sama muncul lebih dari sekali di file.");
      }
      seenMemberPositions.add(memberPositionKey);

      if (
        division &&
        (position.key === "ketua-divisi" || position.key === "pj-divisi")
      ) {
        const assignedDivisions = memberDivisionAssignments.get(member.id);
        if (assignedDivisions?.size && !assignedDivisions.has(division)) {
          rowIssues.push("Anggota sudah memegang jabatan divisi pada divisi lain.");
        }
        const previousDivision = [...(assignedDivisions ?? [])][0];
        if (previousDivision && previousDivision !== division) {
          rowIssues.push("Anggota hanya dapat memegang jabatan divisi pada satu divisi per periode.");
        }
      }

      if (
        division !== null ||
        position.key === "ketua-umum"
      ) {
        const slot = `${position.key}:${division ?? ""}`;
        if (occupiedSlots.has(slot) || seenSlots.has(slot)) {
          rowIssues.push("Jabatan ini sudah memiliki penanggung jawab pada periode ini.");
        }
        seenSlots.add(slot);
      }
    }

    if (rowIssues.length) {
      issues.push(...rowIssues.map((message) => ({ row: input.rowNumber, message })));
      continue;
    }
    if (!member || !position) continue;

    let accountEmail = member.user?.email ?? "";
    let accountAction: OfficerAssignmentImportRow["accountAction"] =
      member.user?.isActive === false ? "activate" : "existing";
    if (!member.userId) {
      const emailFromThisFile = sameFileAccounts.get(member.id);
      if (emailFromThisFile) {
        accountEmail = emailFromThisFile;
        accountAction = "same-file";
      } else {
        const email = createUniqueMemberEmail(
          member.fullName,
          membershipDivision,
          period.name,
          usedEmails,
        );
        if (!email) {
          issues.push({
            row: input.rowNumber,
            message: "Email akun tidak dapat dibuat dari nama dan divisi keanggotaan.",
          });
          continue;
        }
        accountEmail = email;
        accountAction = "create";
        sameFileAccounts.set(member.id, email);
      }
    }

    rows.push({
      rowNumber: input.rowNumber,
      memberId: member.id,
      memberCode: member.memberCode,
      cohort: member.cohort ?? cohort,
      memberAction: newMembersByNim.has(nim) ? "create" : "existing",
      membershipAction: member.memberships.length ? "existing" : "create",
      accountUserId: member.userId,
      nim: member.nim,
      name: member.fullName,
      position: position.key,
      positionLabel: position.label,
      division,
      membershipDivision,
      accountEmail,
      accountAction,
    });
    existingMemberPositions.add(`${member.id}:${position.key}`);
    if (division && (position.key === "ketua-divisi" || position.key === "pj-divisi")) {
      const assignedDivisions = memberDivisionAssignments.get(member.id) ?? new Set();
      assignedDivisions.add(division);
      memberDivisionAssignments.set(member.id, assignedDivisions);
    }
    if (
      division !== null ||
      position.key === "ketua-umum"
    ) {
      occupiedSlots.add(`${position.key}:${division ?? ""}`);
    }
  }

  return { period, rows, issues };
}

export async function getEffectiveUserPageAccess(
  role: AppRoleId,
  userId: string,
): Promise<{
  pages: PageAccessKey[];
  managedDivision: string | null;
  positions: OfficerPositionKey[];
}> {
  if (role === "super-admin") {
    return {
      pages: pageAccessPages.map(({ key }) => key),
      managedDivision: null,
      positions: [],
    };
  }
  const databaseRole = getAppRole(role)?.databaseRole;
  if (!databaseRole) throw new Error(`Unknown application role: ${role}`);

  const [roleOverrides, assignments] = await Promise.all([
    prisma.rolePageAccess.findMany({
      where: { role: databaseRole },
      select: { pageKey: true, enabled: true },
    }),
    prisma.officerAssignment.findMany({
      where: {
        period: { isActive: true },
        member: {
          userId,
          memberships: {
            some: {
              period: { isActive: true },
              status: "ACTIVE",
            },
          },
        },
      },
      select: { position: true, division: true },
    }),
  ]);
  const positions = [...new Set(assignments.map(({ position }) => position))].filter(
    isOfficerPositionKey,
  );
  const positionOverrides = positions.length
    ? await prisma.positionPageAccess.findMany({
        where: { position: { in: positions } },
        select: { position: true, pageKey: true, enabled: true },
      })
    : [];
  const roleSetting = new Map(
    roleOverrides.map(({ pageKey, enabled }) => [pageKey, enabled]),
  );
  const positionSetting = new Map(
    positionOverrides.map(({ position, pageKey, enabled }) => [
      `${position}:${pageKey}`,
      enabled,
    ]),
  );

  const pages = pageAccessPages
    .filter(({ key }) => {
      const roleEnabled =
        roleSetting.get(key) ?? getDefaultRolePageAccess(role, key);
      if (roleEnabled) return true;

      return positions.some(
        (position) =>
          positionSetting.get(`${position}:${key}`) ??
          getDefaultPositionPageAccess(position, key),
      );
    })
    .map(({ key }) => key);
  const assignedDivisions = [
    ...new Set(
      assignments.flatMap(({ position, division }) =>
        (position === "ketua-divisi" || position === "pj-divisi") && division
          ? [division]
          : [],
      ),
    ),
  ];

  return {
    pages,
    managedDivision: assignedDivisions.length === 1 ? assignedDivisions[0] : null,
    positions,
  };
}

export async function getPageAccessSettings() {
  const [roleOverrides, positionOverrides] = await Promise.all([
    prisma.rolePageAccess.findMany({
      select: { role: true, pageKey: true, enabled: true },
    }),
    prisma.positionPageAccess.findMany({
      select: { position: true, pageKey: true, enabled: true },
    }),
  ]);
  const roleSetting = new Map(
    roleOverrides.map(({ role, pageKey, enabled }) => [
      `${role.toLowerCase().replaceAll("_", "-")}:${pageKey}`,
      enabled,
    ]),
  );
  const positionSetting = new Map(
    positionOverrides.map(({ position, pageKey, enabled }) => [
      `${position}:${pageKey}`,
      enabled,
    ]),
  );

  return {
    pages: [...pageAccessPages],
    roles: accessManagedRoles.map((role) => ({
      ...role,
      pages: pageAccessPages.map(({ key }) => ({
        key,
        enabled:
          role.id === "super-admin" ||
          (roleSetting.get(`${role.id}:${key}`) ??
            getDefaultRolePageAccess(role.id, key)),
      })),
    })),
    positions: officerPositions.map((position) => ({
      ...position,
      pages: pageAccessPages.map(({ key }) => ({
        key,
        enabled:
          positionSetting.get(`${position.key}:${key}`) ??
          getDefaultPositionPageAccess(position.key, key),
      })),
    })),
  };
}

export async function savePageAccessSettings(
  changes: AccessChange[],
  actorId: string,
) {
  await prisma.$transaction(async (transaction) => {
    for (const change of changes) {
      if (change.scope === "role") {
        if (change.target === "super-admin") {
          throw new Error("Akses Super Admin tidak dapat diubah.");
        }
        const databaseRole = getAppRole(change.target)?.databaseRole;
        if (!databaseRole) throw new Error("Role tidak ditemukan.");
        await transaction.rolePageAccess.upsert({
          where: {
            role_pageKey: {
              role: databaseRole,
              pageKey: change.page,
            },
          },
          create: {
            id: randomUUID(),
            role: databaseRole,
            pageKey: change.page,
            enabled: change.enabled,
          },
          update: { enabled: change.enabled },
        });
      } else {
        await transaction.positionPageAccess.upsert({
          where: {
            position_pageKey: {
              position: change.target,
              pageKey: change.page,
            },
          },
          create: {
            id: randomUUID(),
            position: change.target,
            pageKey: change.page,
            enabled: change.enabled,
          },
          update: { enabled: change.enabled },
        });
      }

      await writeAuditLog(transaction, {
        actorId,
        action: "access.updated",
        entity: "account",
        entityId: `${change.scope}:${change.target}:${change.page}`,
        newValue: { enabled: change.enabled },
      });
    }
  });
}

export async function getOfficerAssignmentData(periodId?: string) {
  const periods = await prisma.period.findMany({
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
    select: { id: true, name: true, isActive: true },
  });
  const selectedPeriod =
    periods.find(({ id }) => id === periodId) ??
    periods.find(({ isActive }) => isActive) ??
    periods[0];
  if (!selectedPeriod) return { periods, selectedPeriod: null, members: [], assignments: [], divisions: [] };

  const [members, assignments, divisions] = await Promise.all([
    prisma.member.findMany({
      where: {
        memberships: {
          some: { periodId: selectedPeriod.id, status: "ACTIVE" },
        },
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        nim: true,
        user: { select: { id: true, role: true } },
      },
      take: 1000,
    }),
    prisma.officerAssignment.findMany({
      where: { periodId: selectedPeriod.id },
      orderBy: [{ position: "asc" }, { division: "asc" }],
      select: {
        id: true,
        position: true,
        division: true,
        member: { select: { id: true, fullName: true, nim: true, userId: true } },
      },
    }),
    prisma.division.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { name: true },
    }),
  ]);

  return {
    periods,
    selectedPeriod,
    members,
    assignments,
    divisions: divisions.map(({ name }) => name),
  };
}

export async function createOfficerAssignment(
  input: {
    memberId: string;
    periodId: string;
    position: string;
    division: string | null;
  },
  actorId: string,
) {
  if (!isOfficerPositionKey(input.position)) {
    throw new Error("Jabatan pengurus tidak valid.");
  }
  const position = officerPositions.find(({ key }) => key === input.position)!;
  if (position.requiresDivision !== Boolean(input.division)) {
    throw new Error(
      position.requiresDivision
        ? "Pilih divisi untuk jabatan ini."
        : "Jabatan ini tidak menggunakan divisi.",
    );
  }
  if (input.division) {
    const division = await prisma.division.findFirst({
      where: { name: input.division, isActive: true },
      select: { id: true },
    });
    if (!division) throw new Error("Divisi tidak aktif atau tidak ditemukan.");
  }

  return prisma.$transaction(async (transaction) => {
    const [member, period] = await Promise.all([
      transaction.member.findFirst({
        where: {
          id: input.memberId,
          memberships: {
            some: { periodId: input.periodId, status: "ACTIVE" },
          },
        },
        select: { id: true, fullName: true, nim: true },
      }),
      transaction.period.findUnique({
        where: { id: input.periodId },
        select: { id: true, name: true },
      }),
    ]);
    if (!member || !period) {
      throw new Error("Anggota dan periode harus terdaftar sebelum menetapkan jabatan.");
    }
    if (input.position === "ketua-divisi" || input.position === "pj-divisi") {
      const conflictingDivisionAssignment =
        await transaction.officerAssignment.findFirst({
          where: {
            memberId: input.memberId,
            periodId: input.periodId,
            position: { in: ["ketua-divisi", "pj-divisi"] },
            division: { not: input.division },
          },
          select: { id: true },
        });
      if (conflictingDivisionAssignment) {
        throw new Error("Anggota hanya dapat memegang jabatan divisi pada satu divisi per periode.");
      }
    }
    const positionIsUnique =
      input.position === "ketua-umum" ||
      input.position === "ketua-divisi" ||
      input.position === "pj-divisi";
    if (positionIsUnique) {
      const positionHolder = await transaction.officerAssignment.findFirst({
        where: {
          periodId: input.periodId,
          position: input.position,
          division: input.division,
        },
        select: { id: true },
      });
      if (positionHolder) {
        throw new Error("Jabatan tersebut sudah memiliki penanggung jawab pada periode ini.");
      }
    }
    const duplicate = await transaction.officerAssignment.findFirst({
      where: {
        memberId: input.memberId,
        periodId: input.periodId,
        position: input.position,
      },
      select: { id: true },
    });
    if (duplicate) throw new Error("Anggota ini sudah memiliki jabatan tersebut pada periode ini.");

    const assignment = await transaction.officerAssignment.create({
      data: {
        id: randomUUID(),
        memberId: input.memberId,
        periodId: input.periodId,
        position: input.position,
        division: input.division,
      },
      select: { id: true, position: true, division: true },
    });
    await writeAuditLog(transaction, {
      actorId,
      action: "officer.assignment_created",
      entity: "account",
      entityId: assignment.id,
      newValue: {
        memberId: member.id,
        name: member.fullName,
        nim: member.nim,
        period: period.name,
        position: input.position,
        division: input.division,
      },
    });
    return { ...assignment, member };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function previewOfficerAssignmentImport(
  periodId: string,
  inputs: OfficerAssignmentImportInput[],
) {
  return inspectOfficerAssignmentImport(prisma, periodId, inputs);
}

export async function createOfficerAssignmentsFromImport(
  periodId: string,
  inputs: OfficerAssignmentImportInput[],
  actorId: string,
) {
  const initialPreview = await inspectOfficerAssignmentImport(
    prisma,
    periodId,
    inputs,
  );
  if (initialPreview.issues.length || !initialPreview.rows.length) {
    return {
      ...initialPreview,
      createdCount: 0,
      createdMembersCount: 0,
      createdAccounts: [] as OfficerAssignmentImportCredential[],
    };
  }
  const accountPasswordHash = initialPreview.rows.some(
    (row) => row.accountAction === "create",
  )
    ? await hashPassword(initialAccountPassword)
    : null;

  return prisma.$transaction(
    async (transaction) => {
      const preview = await inspectOfficerAssignmentImport(
        transaction,
        periodId,
        inputs,
      );
      if (preview.issues.length) {
        return {
          ...preview,
          createdCount: 0,
          createdMembersCount: 0,
          createdAccounts: [] as OfficerAssignmentImportCredential[],
        };
      }
      if (!preview.rows.length) {
        return {
          ...preview,
          issues: [{ row: 0, message: "Tidak ada penugasan yang dapat diimpor." }],
          createdCount: 0,
          createdMembersCount: 0,
          createdAccounts: [] as OfficerAssignmentImportCredential[],
        };
      }

      const newMembers = [
        ...new Map(
          preview.rows
            .filter((row) => row.memberAction === "create")
            .map((row) => [row.memberId, row]),
        ).values(),
      ];
      if (newMembers.length) {
        await transaction.member.createMany({
          data: newMembers.map((row) => ({
            id: row.memberId,
            memberCode: row.memberCode,
            fullName: row.name,
            nim: row.nim,
            cohort: row.cohort,
          })),
        });
      }

      const membershipRows = [
        ...new Map(preview.rows.map((row) => [row.memberId, row])).values(),
      ].filter((row) => row.membershipAction === "create");
      const membershipByMember = new Map(
        membershipRows.map((row) => [row.memberId, row.membershipDivision]),
      );
      if ([...membershipByMember.values()].includes("Organisasi")) {
        const organizationDivision = await transaction.division.findUnique({
          where: { name: "Organisasi" },
          select: { id: true, isActive: true, sortOrder: true },
        });
        if (!organizationDivision) {
          const lastDivision = await transaction.division.findFirst({
            orderBy: { sortOrder: "desc" },
            select: { sortOrder: true },
          });
          const createdDivision = await transaction.division.create({
            data: {
              id: randomUUID(),
              name: "Organisasi",
              isActive: true,
              sortOrder: (lastDivision?.sortOrder ?? 0) + 1,
            },
            select: { id: true },
          });
          await writeAuditLog(transaction, {
            actorId,
            action: "division.created",
            entity: "division",
            entityId: createdDivision.id,
            newValue: { name: "Organisasi", createdBy: "officer_roster_import" },
          });
        } else if (!organizationDivision.isActive) {
          await transaction.division.update({
            where: { id: organizationDivision.id },
            data: { isActive: true },
          });
        }
      }
      if (membershipByMember.size) {
        await transaction.membership.createMany({
          data: [...membershipByMember].map(([memberId, division]) => ({
            id: randomUUID(),
            memberId,
            periodId,
            division,
            status: "ACTIVE",
          })),
          skipDuplicates: true,
        });
      }
      const membersToUpdateCohort = [
        ...new Map(
          preview.rows
            .filter((row) => row.memberAction === "existing" && row.cohort)
            .map((row) => [row.memberId, row]),
        ).values(),
      ];
      for (const row of membersToUpdateCohort) {
        await transaction.member.updateMany({
          where: { id: row.memberId, cohort: null },
          data: { cohort: row.cohort },
        });
      }

      const newAccounts = preview.rows
        .filter((row) => row.accountAction === "create")
        .reduce<{
          id: string;
          accountId: string;
          memberId: string;
          name: string;
          nim: string;
          email: string;
        }[]>((accounts, row) => {
          if (accounts.some((account) => account.memberId === row.memberId)) return accounts;
          accounts.push({
            id: randomUUID(),
            accountId: randomUUID(),
            memberId: row.memberId,
            name: row.name,
            nim: row.nim,
            email: row.accountEmail,
          });
          return accounts;
        }, []);
      if (newAccounts.length && !accountPasswordHash) {
        throw new Error("Password awal akun tidak tersedia.");
      }
      if (newAccounts.length) {
        await transaction.user.createMany({
          data: newAccounts.map(({ id, name, email }) => ({
            id,
            name,
            email,
            emailVerified: false,
            role: "MEMBER",
            isActive: true,
          })),
        });
        await transaction.account.createMany({
          data: newAccounts.map(({ id, accountId }) => ({
            id: accountId,
            accountId: id,
            providerId: "credential",
            userId: id,
            password: accountPasswordHash,
          })),
        });
        for (const account of newAccounts) {
          const linked = await transaction.member.updateMany({
            where: { id: account.memberId, userId: null },
            data: { userId: account.id },
          });
          if (linked.count !== 1) {
            throw new Error("Data akun anggota berubah bersamaan. Muat ulang lalu coba lagi.");
          }
        }
      }

      const accountIdsToActivate = [
        ...new Set(
          preview.rows
            .filter((row) => row.accountAction === "activate")
            .map((row) => row.memberId),
        ),
      ];
      for (const memberId of accountIdsToActivate) {
        const source = preview.rows.find((row) => row.memberId === memberId);
        if (!source?.accountUserId) continue;
        await transaction.user.update({
          where: { id: source.accountUserId },
          data: { name: source.name, isActive: true },
        });
      }

      await transaction.officerAssignment.createMany({
        data: preview.rows.map((row) => ({
          id: randomUUID(),
          memberId: row.memberId,
          periodId,
          position: row.position,
          division: row.division,
        })),
      });
      await writeAuditLogs(
        transaction,
        newMembers.map((member) => ({
          actorId,
          action: "member.created" as const,
          entity: "member" as const,
          entityId: member.memberCode,
          newValue: {
            name: member.name,
            nim: member.nim,
            cohort: member.cohort,
            division: member.membershipDivision,
            createdBy: "officer_roster_import",
          },
        })),
      );
      await writeAuditLogs(
        transaction,
        newAccounts.map((account) => ({
          actorId,
          action: "account.created" as const,
          entity: "account" as const,
          entityId: account.id,
          newValue: {
            name: account.name,
            email: account.email,
            role: "MEMBER",
            createdBy: "officer_assignments_import",
          },
        })),
      );
      await writeAuditLog(transaction, {
        actorId,
        action: "officer.assignments_imported",
        entity: "account",
        entityId: periodId,
        newValue: {
          period: preview.period.name,
          assignmentCount: preview.rows.length,
          memberCount: newMembers.length,
          accountCount: newAccounts.length,
        },
      });
      return {
        ...preview,
        createdCount: preview.rows.length,
        createdMembersCount: newMembers.length,
        createdAccounts: newAccounts.map((account) => ({
          id: account.id,
          name: account.name,
          nim: account.nim,
          email: account.email,
          initialPassword: initialAccountPassword,
        })),
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function deleteOfficerAssignment(id: string, actorId: string) {
  await prisma.$transaction(async (transaction) => {
    const assignment = await transaction.officerAssignment.findUnique({
      where: { id },
      select: {
        id: true,
        position: true,
        division: true,
        member: { select: { fullName: true, nim: true } },
        period: { select: { name: true } },
      },
    });
    if (!assignment) throw new Error("Penugasan pengurus tidak ditemukan.");
    await transaction.officerAssignment.delete({ where: { id } });
    await writeAuditLog(transaction, {
      actorId,
      action: "officer.assignment_deleted",
      entity: "account",
      entityId: id,
      oldValue: {
        name: assignment.member.fullName,
        nim: assignment.member.nim,
        period: assignment.period.name,
        position: assignment.position,
        division: assignment.division,
      },
    });
  });
}

export function parsePageAccessChanges(value: unknown): AccessChange[] | null {
  if (!Array.isArray(value) || value.length > 200) return null;
  const changes: AccessChange[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const record = item as Record<string, unknown>;
    if (
      (record.scope !== "role" && record.scope !== "position") ||
      typeof record.target !== "string" ||
      typeof record.page !== "string" ||
      typeof record.enabled !== "boolean" ||
      !isPageAccessKey(record.page)
    ) {
      return null;
    }
    if (record.scope === "role") {
      const role = accessManagedRoles.find(({ id }) => id === record.target);
      if (!role || role.id === "super-admin") return null;
      const identity = `role:${role.id}:${record.page}`;
      if (seen.has(identity)) return null;
      seen.add(identity);
      changes.push({
        scope: "role",
        target: role.id,
        page: record.page,
        enabled: record.enabled,
      });
    } else {
      if (!isOfficerPositionKey(record.target)) return null;
      const identity = `position:${record.target}:${record.page}`;
      if (seen.has(identity)) return null;
      seen.add(identity);
      changes.push({
        scope: "position",
        target: record.target,
        page: record.page,
        enabled: record.enabled,
      });
    }
  }
  return changes;
}
