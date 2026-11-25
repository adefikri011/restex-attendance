import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { getAppRole, type AppRoleId } from "@/components/auth/role-config";
import { writeAuditLog } from "@/lib/audit-log-service";
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

export async function getEffectiveUserPageAccess(
  role: AppRoleId,
  userId: string,
): Promise<{ pages: PageAccessKey[]; managedDivision: string | null }> {
  if (role === "super-admin") {
    return {
      pages: pageAccessPages.map(({ key }) => key),
      managedDivision: null,
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
