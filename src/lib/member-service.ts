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

export async function getMembersPageData() {
  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, startDate: true, endDate: true },
  });

  if (!activePeriod) {
    return { periodName: null, members: [] as Member[] };
  }

  const rows = await prisma.member.findMany({
    where: {
      memberships: {
        some: { periodId: activePeriod.id },
      },
    },
    orderBy: { fullName: "asc" },
    select: {
      memberCode: true,
      fullName: true,
      nim: true,
      cohort: true,
      user: { select: { email: true } },
      memberships: {
        where: { periodId: activePeriod.id },
        take: 1,
        select: { division: true, status: true, joinedAt: true },
      },
    },
  });

  return {
    periodName: activePeriod.name,
    members: rows.flatMap((row) => {
      const membership = row.memberships[0];
      if (!membership) return [];

      return [{
        id: row.memberCode,
        name: row.fullName,
        email: row.user?.email ?? "",
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
