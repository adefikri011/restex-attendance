import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@/generated/prisma/client";
import { getPeriodEmailCode } from "@/components/members/member-data";
import {
  type AdministratorAccount,
} from "@/components/administrator-accounts/administrator-account-data";
import { initialAccountPassword } from "@/lib/account-credentials";
import { writeAuditLog } from "@/lib/audit-log-service";
import { prisma } from "@/lib/prisma";

export type NewAdministratorInput = {
  name: string;
  role: "super-admin" | "admin";
};

function nextOfficerMemberCode(serial: number, year: number) {
  return `RTX-${year}-${String(serial).padStart(3, "0")}`;
}

async function ensureOfficerMemberIdentity(
  transaction: Prisma.TransactionClient,
  input: {
    userId: string;
    name: string;
    division: string | null;
    periodId: string;
    periodYear: number;
  },
) {
  const existing = await transaction.member.findUnique({
    where: { userId: input.userId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const existingCodes = await transaction.member.findMany({
    where: {
      memberCode: { startsWith: `RTX-${input.periodYear}-` },
    },
    select: { memberCode: true },
  });
  const nextSerial =
    existingCodes.reduce((largest, { memberCode }) => {
      const serial = Number(memberCode.split("-").at(-1));
      return Number.isInteger(serial) ? Math.max(largest, serial) : largest;
    }, 0) + 1;
  const memberCode = nextOfficerMemberCode(nextSerial, input.periodYear);

  const member = await transaction.member.create({
    data: {
      id: randomUUID(),
      memberCode,
      fullName: input.name,
      nim: `PENG-${input.userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`,
      cohort: null,
      user: { connect: { id: input.userId } },
      memberships: {
        create: {
          id: randomUUID(),
          period: { connect: { id: input.periodId } },
          division: input.division ?? "Organisasi",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      },
    },
    select: { id: true },
  });
  return member.id;
}

export async function ensureOfficerMemberIdentityForUser(userId: string) {
  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
    select: { id: true, startDate: true },
  });
  if (!activePeriod) return null;
  const officer = await prisma.user.findFirst({
    where: {
      id: userId,
      role: { in: ["SUPER_ADMIN", "ADMIN"] },
    },
    select: { id: true, name: true, managedDivision: true },
  });
  if (!officer) return null;
  return prisma.$transaction(async (transaction) =>
    ensureOfficerMemberIdentity(transaction, {
      userId: officer.id,
      name: officer.name,
      division: officer.managedDivision,
      periodId: activePeriod.id,
      periodYear: activePeriod.startDate.getUTCFullYear(),
    }),
  );
}

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(value)
    : null;
}

export async function getAdministratorAccountsPageData() {
  await prisma.$transaction(async (transaction) => {
    const activePeriod = await transaction.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { id: true, startDate: true },
    });
    if (!activePeriod) return;
    const officers = await transaction.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
      select: { id: true, name: true, role: true, managedDivision: true },
    });
    for (const officer of officers) {
      await ensureOfficerMemberIdentity(transaction, {
        userId: officer.id,
        name: officer.name,
        division: officer.managedDivision,
        periodId: activePeriod.id,
        periodYear: activePeriod.startDate.getUTCFullYear(),
      });
    }
  });
  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true },
  });
  const users = await prisma.user.findMany({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      updatedAt: true,
      role: true,
      isActive: true,
      authSessions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      member: {
        select: { memberCode: true, nim: true, cohort: true },
      },
    },
  });

  const accounts: AdministratorAccount[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    photoUrl: user.image
      ? `/api/users/${encodeURIComponent(user.id)}/photo?v=${user.updatedAt.getTime()}`
      : null,
    role:
      user.role === "SUPER_ADMIN"
        ? "Super Admin"
        : "Admin",
    division: null,
    status: user.isActive ? "Aktif" : "Nonaktif",
    lastActiveAt: formatDate(user.authSessions[0]?.createdAt ?? null),
    memberCode: user.member?.memberCode,
    nim: user.member?.nim,
    cohort: user.member?.cohort,
  }));
  return { accounts, periodName: activePeriod?.name ?? null };
}

function accountEmailBase(name: string, role: NewAdministratorInput["role"], periodName: string) {
  const nameSlug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const roleSlug = role === "super-admin" ? "superadmin" : "admin";
  return `${nameSlug}_${roleSlug}_${getPeriodEmailCode(periodName)}@restex.id`;
}

export async function createAdministratorAccount(
  input: NewAdministratorInput,
  actorId: string,
) {
  if (input.name.length < 2 || input.name.length > 120) {
    throw new Error("Nama harus terdiri dari 2–120 karakter.");
  }
  const password = await hashPassword(initialAccountPassword);

  const account = await prisma.$transaction(async (transaction) => {
    const activePeriod = await transaction.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, startDate: true },
    });
    if (!activePeriod) throw new Error("Tidak ada periode aktif.");

    const emailBase = accountEmailBase(
      input.name,
      input.role,
      activePeriod.name,
    );
    if (!emailBase) throw new Error("Email tidak dapat dibuat dari nama.");
    const [localPart, domain] = emailBase.split("@");
    let email = emailBase;
    let suffix = 2;
    while (await transaction.user.findUnique({ where: { email }, select: { id: true } })) {
      email = `${localPart}_${suffix}@${domain}`;
      suffix += 1;
    }

    const userId = randomUUID();
    const user = await transaction.user.create({
      data: {
        id: userId,
        name: input.name,
        email,
        role: input.role === "super-admin" ? "SUPER_ADMIN" : "ADMIN",
        managedDivision: null,
        isActive: true,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: userId,
            providerId: "credential",
            password,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true },
    });
    await writeAuditLog(transaction, {
      actorId,
      action: "account.created",
      entity: "account",
      entityId: user.id,
      newValue: {
        name: user.name,
        role: user.role,
      },
    });
    await ensureOfficerMemberIdentity(transaction, {
      userId,
      name: user.name,
      division: null,
      periodId: activePeriod.id,
      periodYear: activePeriod.startDate.getUTCFullYear(),
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role:
        user.role === "SUPER_ADMIN"
          ? "Super Admin" as const
          : "Admin" as const,
      division: null,
      status: "Aktif" as const,
      lastActiveAt: null,
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return { account, initialPassword: initialAccountPassword };
}

export async function setAdministratorAccountActive(
  id: string,
  isActive: boolean,
  actorId: string,
) {
  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
    if (!user || user.role !== "ADMIN") {
      throw new Error("Akun pengurus tidak ditemukan.");
    }

    if (user.isActive === isActive) return;
    await transaction.user.update({ where: { id }, data: { isActive } });
    await writeAuditLog(transaction, {
      actorId,
      action: isActive ? "account.activated" : "account.deactivated",
      entity: "account",
      entityId: user.id,
      oldValue: { name: user.name, isActive: user.isActive },
      newValue: { name: user.name, isActive },
    });
  });
}
