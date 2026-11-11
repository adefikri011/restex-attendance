import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@/generated/prisma/client";
import { generateMemberEmail, getPeriodEmailCode } from "@/components/members/member-data";
import {
  type AdministratorAccount,
} from "@/components/administrator-accounts/administrator-account-data";
import { initialAccountPassword } from "@/lib/account-credentials";
import { writeAuditLog } from "@/lib/audit-log-service";
import { getDivisionNames } from "@/lib/division-service";
import { prisma } from "@/lib/prisma";

export type NewAdministratorInput = {
  name: string;
  role: "admin" | "ketua-divisi" | "pj-divisi";
  division: string | null;
};

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
  const [activePeriod, divisions] = await Promise.all([
    prisma.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }),
    getDivisionNames(),
  ]);
  const [users, memberCounts] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN", "DIVISION_LEAD", "DIVISION_PJ"] } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        updatedAt: true,
        role: true,
        isActive: true,
        managedDivision: true,
        authSessions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    activePeriod
      ? prisma.membership.groupBy({
          by: ["division"],
          where: { periodId: activePeriod.id, status: "ACTIVE" },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

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
        : user.role === "ADMIN"
          ? "Admin"
          : user.role === "DIVISION_PJ"
            ? "PJ Divisi"
            : "Ketua Divisi",
    division: user.managedDivision,
    status: user.isActive ? "Aktif" : "Nonaktif",
    lastActiveAt: formatDate(user.authSessions[0]?.createdAt ?? null),
  }));
  const divisionMemberCounts = Object.fromEntries(
    divisions.map((division) => [
      division,
      memberCounts.find((row) => row.division === division)?._count._all ?? 0,
    ]),
  ) as Record<string, number>;

  return { accounts, divisions, divisionMemberCounts, periodName: activePeriod?.name ?? null };
}

function accountEmailBase(name: string, role: NewAdministratorInput["role"], division: string | null, periodName: string) {
  if ((role === "ketua-divisi" || role === "pj-divisi") && division) {
    return generateMemberEmail(name, division, periodName);
  }

  const nameSlug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${nameSlug}_admin_${getPeriodEmailCode(periodName)}@restex.id`;
}

export async function createAdministratorAccount(
  input: NewAdministratorInput,
  actorId: string,
) {
  if (input.name.length < 2 || input.name.length > 120) {
    throw new Error("Nama harus terdiri dari 2–120 karakter.");
  }
  if (
    (input.role === "admin" && input.division !== null) ||
    (input.role !== "admin" && !input.division)
  ) {
    throw new Error("Jabatan atau divisi tidak valid.");
  }

  const password = await hashPassword(initialAccountPassword);

  const account = await prisma.$transaction(async (transaction) => {
    const activePeriod = await transaction.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    });
    if (!activePeriod) throw new Error("Tidak ada periode aktif.");

    if (input.role !== "admin") {
      const division = input.division;
      if (!division) throw new Error("Jabatan atau divisi tidak valid.");
      const activeDivision = await transaction.division.findFirst({
        where: { name: division, isActive: true },
        select: { id: true },
      });
      if (!activeDivision) throw new Error("Jabatan atau divisi tidak valid.");

      const currentLead = await transaction.user.findFirst({
        where: {
          role: input.role === "ketua-divisi" ? "DIVISION_LEAD" : "DIVISION_PJ",
          managedDivision: division,
          isActive: true,
        },
        select: { id: true },
      });
      if (currentLead) {
        throw new Error(
          input.role === "ketua-divisi"
            ? "Divisi tersebut sudah memiliki Ketua Divisi aktif."
            : "Divisi tersebut sudah memiliki PJ aktif.",
        );
      }
    }

    const emailBase = accountEmailBase(
      input.name,
      input.role,
      input.division,
      activePeriod.name,
    );
    if (!emailBase) throw new Error("Email tidak dapat dibuat dari nama dan divisi.");
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
        role:
          input.role === "admin"
            ? "ADMIN"
            : input.role === "ketua-divisi"
              ? "DIVISION_LEAD"
              : "DIVISION_PJ",
        managedDivision: input.division,
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
      select: { id: true, name: true, email: true, role: true, managedDivision: true },
    });
    await writeAuditLog(transaction, {
      actorId,
      action: "account.created",
      entity: "account",
      entityId: user.id,
      newValue: {
        name: user.name,
        role: user.role,
        division: user.managedDivision,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role:
        user.role === "ADMIN"
          ? "Admin" as const
          : user.role === "DIVISION_PJ"
            ? "PJ Divisi" as const
            : "Ketua Divisi" as const,
      division: user.managedDivision,
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
        managedDivision: true,
        isActive: true,
      },
    });
    if (!user || !["ADMIN", "DIVISION_LEAD", "DIVISION_PJ"].includes(user.role)) {
      throw new Error("Akun pengurus tidak ditemukan.");
    }

    if (
      isActive &&
      (user.role === "DIVISION_LEAD" || user.role === "DIVISION_PJ") &&
      user.managedDivision
    ) {
      const existingAssignee = await transaction.user.findFirst({
        where: {
          id: { not: id },
          role: user.role,
          managedDivision: user.managedDivision,
          isActive: true,
        },
        select: { id: true },
      });
      if (existingAssignee) {
        throw new Error(
          user.role === "DIVISION_LEAD"
            ? "Divisi tersebut sudah memiliki Ketua Divisi aktif."
            : "Divisi tersebut sudah memiliki PJ aktif.",
        );
      }
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
