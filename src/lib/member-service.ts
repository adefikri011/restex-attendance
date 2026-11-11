import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@/generated/prisma/client";
import type { MembershipStatus as DatabaseMembershipStatus } from "@/generated/prisma/enums";
import {
  generateMemberEmail,
  type Member,
  type MemberCredential,
  type MembershipStatus,
} from "@/components/members/member-data";
import { initialAccountPassword } from "@/lib/account-credentials";
import { getDivisionNames } from "@/lib/division-service";
import { prisma } from "@/lib/prisma";

export type NewMemberInput = {
  name: string;
  nim: string;
  division: string;
  cohort: string;
  status: MembershipStatus;
};

export type CreatedMember = MemberCredential;

const statusToDatabase: Record<MembershipStatus, DatabaseMembershipStatus> = {
  Aktif: "ACTIVE",
  Cuti: "ON_LEAVE",
  Keluar: "EXITED",
  Alumni: "ALUMNI",
};

const statusFromDatabase: Record<DatabaseMembershipStatus, MembershipStatus> = {
  ACTIVE: "Aktif",
  ON_LEAVE: "Cuti",
  EXITED: "Keluar",
  ALUMNI: "Alumni",
};

export async function getMembersPageData(division?: string | null) {
  const [activePeriod, divisions] = await Promise.all([
    prisma.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, startDate: true, endDate: true },
    }),
    getDivisionNames(),
  ]);

  if (!activePeriod) {
    return { periodName: null, members: [] as Member[], divisions };
  }
  if (division === null) {
    return { periodName: activePeriod.name, members: [] as Member[], divisions };
  }

  const rows = await prisma.member.findMany({
    where: {
      memberships: {
        some: {
          periodId: activePeriod.id,
          ...(division === undefined ? {} : { division }),
        },
      },
    },
    orderBy: { fullName: "asc" },
    select: {
      memberCode: true,
      fullName: true,
      nim: true,
      cohort: true,
      photoUrl: true,
      updatedAt: true,
      user: { select: { email: true } },
      memberships: {
        where: {
          periodId: activePeriod.id,
          ...(division === undefined ? {} : { division }),
        },
        take: 1,
        select: { division: true, status: true, joinedAt: true },
      },
    },
  });

  return {
    periodName: activePeriod.name,
    divisions,
    members: rows.flatMap((row) => {
      const membership = row.memberships[0];
      if (!membership) return [];

      return [{
        id: row.memberCode,
        name: row.fullName,
        email: row.user?.email ?? "",
        photoUrl: row.photoUrl
          ? `/api/members/${encodeURIComponent(row.memberCode)}/photo?v=${row.updatedAt.getTime()}`
          : null,
        nim: row.nim,
        division: membership.division,
        cohort: row.cohort,
        status: statusFromDatabase[membership.status],
        attendance: null,
        joinedAt: new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Jakarta",
        }).format(membership.joinedAt),
      }];
    }),
  };
}

function nextMemberCode(serial: number, year: number) {
  return `RTX-${year}-${String(serial).padStart(3, "0")}`;
}

function createUniqueEmail(
  input: NewMemberInput,
  periodName: string,
  usedEmails: Set<string>,
) {
  const baseEmail = generateMemberEmail(input.name, input.division, periodName);
  if (!baseEmail) {
    throw new Error("Email anggota tidak dapat dibuat dari nama dan divisi.");
  }

  const [localPart, domain] = baseEmail.split("@");
  let email = baseEmail;
  let suffix = 2;
  while (usedEmails.has(email)) {
    email = `${localPart}_${suffix}@${domain}`;
    suffix += 1;
  }

  usedEmails.add(email);
  return email;
}

async function createMembersTransaction(inputs: NewMemberInput[]) {
  const passwordHash = await hashPassword(initialAccountPassword);

  return prisma.$transaction(
    async (transaction) => {
      const activePeriod = await transaction.period.findFirst({
        where: { isActive: true },
        orderBy: { startDate: "desc" },
        select: { id: true, name: true, startDate: true },
      });

      if (!activePeriod) {
        throw new Error("Tidak ada periode aktif. Buat periode sebelum menambah anggota.");
      }

      const activeDivisions = await transaction.division.findMany({
        where: { isActive: true, name: { in: inputs.map(({ division }) => division) } },
        select: { name: true },
      });
      const availableDivisions = new Set(activeDivisions.map(({ name }) => name));
      const unavailableDivision = inputs.find(({ division }) => !availableDivisions.has(division));
      if (unavailableDivision) {
        throw new Error(`Divisi "${unavailableDivision.division}" tidak aktif atau tidak ditemukan.`);
      }

      const nims = inputs.map(({ nim }) => nim);
      const existingMembers = await transaction.member.findMany({
        where: { nim: { in: nims } },
        select: { nim: true },
      });
      if (existingMembers.length > 0) {
        throw new Error(
          `NIM sudah terdaftar: ${existingMembers.map(({ nim }) => nim).join(", ")}.`,
        );
      }

      const [users, existingCodes] = await Promise.all([
        transaction.user.findMany({ select: { email: true } }),
        transaction.member.findMany({
          where: { memberCode: { startsWith: `RTX-${activePeriod.startDate.getUTCFullYear()}-` } },
          select: { memberCode: true },
        }),
      ]);
      const usedEmails = new Set(users.map(({ email }) => email.toLowerCase()));
      const year = activePeriod.startDate.getUTCFullYear();
      const nextSerial =
        existingCodes.reduce((largest, { memberCode }) => {
          const serial = Number(memberCode.split("-").at(-1));
          return Number.isInteger(serial) ? Math.max(largest, serial) : largest;
        }, 0) + 1;

      const created: CreatedMember[] = [];
      for (const [index, input] of inputs.entries()) {
        const userId = randomUUID();
        const email = createUniqueEmail(input, activePeriod.name, usedEmails);
        const memberCode = nextMemberCode(nextSerial + index, year);
        const joinedAt = new Date();

        await transaction.user.create({
          data: {
            id: userId,
            name: input.name,
            email,
            emailVerified: false,
            role: "MEMBER",
            isActive: input.status === "Aktif",
            accounts: {
              create: {
                id: randomUUID(),
                accountId: userId,
                providerId: "credential",
                password: passwordHash,
              },
            },
          },
        });

        await transaction.member.create({
          data: {
            id: randomUUID(),
            memberCode,
            fullName: input.name,
            nim: input.nim,
            cohort: input.cohort,
            user: { connect: { id: userId } },
            memberships: {
              create: {
                id: randomUUID(),
                period: { connect: { id: activePeriod.id } },
                division: input.division,
                status: statusToDatabase[input.status],
                joinedAt,
              },
            },
          },
        });

        created.push({
          id: memberCode,
          name: input.name,
          email,
          nim: input.nim,
          division: input.division,
          cohort: input.cohort,
          status: input.status,
          attendance: null,
          joinedAt: new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Jakarta",
          }).format(joinedAt),
          initialPassword: initialAccountPassword,
        });
      }

      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function createMembers(inputs: NewMemberInput[]) {
  try {
    return await createMembersTransaction(inputs);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return createMembersTransaction(inputs);
    }

    throw error;
  }
}

export async function updateMember(
  memberCode: string,
  input: NewMemberInput,
): Promise<Member> {
  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  });
  if (!activePeriod) {
    throw new Error("Tidak ada periode aktif.");
  }
  const divisionExists = await prisma.division.findUnique({
    where: { name: input.division },
    select: { id: true },
  });
  if (!divisionExists) {
    throw new Error("Divisi tidak ditemukan.");
  }

  const member = await prisma.member.findUnique({
    where: { memberCode },
    select: {
      id: true,
      userId: true,
      fullName: true,
      nim: true,
      cohort: true,
      user: { select: { name: true, email: true, isActive: true } },
      memberships: {
        where: { periodId: activePeriod.id },
        take: 1,
        select: { id: true, joinedAt: true, division: true, status: true },
      },
    },
  });
  const membership = member?.memberships[0];
  if (!member || !membership) {
    throw new Error("Anggota tidak ditemukan pada periode aktif.");
  }

  const currentStatus = statusFromDatabase[membership.status];
  if (
    member.fullName === input.name &&
    member.nim === input.nim &&
    member.cohort === input.cohort &&
    membership.division === input.division &&
    currentStatus === input.status
  ) {
    return {
      id: memberCode,
      name: member.fullName,
      email: member.user?.email ?? "",
      nim: member.nim,
      division: membership.division,
      cohort: member.cohort,
      status: currentStatus,
      attendance: null,
      joinedAt: new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(membership.joinedAt),
    };
  }

  const duplicateNim = await prisma.member.findFirst({
    where: { nim: input.nim, id: { not: member.id } },
    select: { id: true },
  });
  if (duplicateNim) {
    throw new Error(`NIM sudah terdaftar: ${input.nim}.`);
  }

  let email: string | null = null;
  if (member.userId) {
    const baseEmail = generateMemberEmail(input.name, input.division, activePeriod.name);
    if (!baseEmail) {
      throw new Error("Email anggota tidak dapat dibuat dari nama dan divisi.");
    }

    const [localPart, domain] = baseEmail.split("@");
    email = baseEmail;
    if (email.toLowerCase() !== member.user?.email.toLowerCase()) {
      const existingUsers = await prisma.user.findMany({
        where: { id: { not: member.userId } },
        select: { email: true },
      });
      const usedEmails = new Set(existingUsers.map(({ email: value }) => value.toLowerCase()));
      let suffix = 2;
      while (usedEmails.has(email.toLowerCase())) {
        email = `${localPart}_${suffix}@${domain}`;
        suffix += 1;
      }
    }
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.member.update({
      where: { id: member.id },
      data: {
        fullName: input.name,
        nim: input.nim,
        cohort: input.cohort,
      },
    });
    await transaction.membership.update({
      where: { id: membership.id },
      data: {
        division: input.division,
        status: statusToDatabase[input.status],
      },
    });
    if (member.userId && email) {
      await transaction.user.update({
        where: { id: member.userId },
        data: {
          name: input.name,
          email,
          isActive: input.status === "Aktif",
        },
      });
    }
  });

  return {
    id: memberCode,
    name: input.name,
    email: email ?? "",
    nim: input.nim,
    division: input.division,
    cohort: input.cohort,
    status: input.status,
    attendance: null,
    joinedAt: new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(membership.joinedAt),
  };
}
