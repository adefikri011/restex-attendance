import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log-service";
import { prisma } from "@/lib/prisma";

export type DivisionSummary = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  membershipCount: number;
  managerCount: number;
};

function normalizeDivisionName(value: string) {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 100) {
    throw new Error("Nama divisi harus terdiri dari 2–100 karakter.");
  }
  return name;
}

export async function getDivisionNames(activeOnly = true) {
  const divisions = await prisma.division.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  return divisions.map(({ name }) => name);
}

export async function getDivisionsPageData(): Promise<DivisionSummary[]> {
  const [divisions, memberships, leaders] = await Promise.all([
    prisma.division.findMany({
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, isActive: true, sortOrder: true },
    }),
    prisma.membership.groupBy({
      by: ["division"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["managedDivision"],
      where: {
        role: { in: ["DIVISION_LEAD", "DIVISION_PJ"] },
        managedDivision: { not: null },
      },
      _count: { _all: true },
    }),
  ]);
  const membershipCounts = new Map(
    memberships.map(({ division, _count }) => [division, _count._all]),
  );
  const managerCounts = new Map(
    leaders.flatMap(({ managedDivision, _count }) =>
      managedDivision ? [[managedDivision, _count._all] as const] : [],
    ),
  );

  return divisions.map((division) => ({
    ...division,
    membershipCount: membershipCounts.get(division.name) ?? 0,
    managerCount: managerCounts.get(division.name) ?? 0,
  }));
}

export async function createDivision(value: string, actorId: string) {
  const name = normalizeDivisionName(value);
  return prisma.$transaction(async (transaction) => {
    const lastDivision = await transaction.division.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const division = await transaction.division.create({
      data: { name, sortOrder: (lastDivision?.sortOrder ?? 0) + 1 },
      select: { id: true, name: true, isActive: true, sortOrder: true },
    });
    await writeAuditLog(transaction, {
      actorId,
      action: "division.created",
      entity: "division",
      entityId: division.id,
      newValue: { name: division.name, isActive: division.isActive },
    });
    return division;
  });
}

export async function updateDivision(
  id: string,
  input: { name?: string; isActive?: boolean },
  actorId: string,
) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.division.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });
    if (!current) throw new Error("Divisi tidak ditemukan.");

    const name = input.name === undefined ? current.name : normalizeDivisionName(input.name);
    if (input.isActive === false) {
      const activeAssignee = await transaction.user.findFirst({
        where: {
          role: { in: ["DIVISION_LEAD", "DIVISION_PJ"] },
          isActive: true,
          managedDivision: current.name,
        },
        select: { id: true },
      });
      if (activeAssignee) {
        throw new Error("Nonaktifkan Ketua Divisi dan PJ terlebih dahulu.");
      }
    }

    const division = await transaction.division.update({
      where: { id },
      data: { name, ...(input.isActive === undefined ? {} : { isActive: input.isActive }) },
      select: { id: true, name: true, isActive: true, sortOrder: true },
    });
    if (name !== current.name) {
      await Promise.all([
        transaction.membership.updateMany({
          where: { division: current.name },
          data: { division: name },
        }),
        transaction.user.updateMany({
          where: { managedDivision: current.name },
          data: { managedDivision: name },
        }),
        transaction.session.updateMany({
          where: { division: current.name },
          data: { division: name },
        }),
      ]);
    }
    if (division.name !== current.name || division.isActive !== current.isActive) {
      await writeAuditLog(transaction, {
        actorId,
        action: "division.updated",
        entity: "division",
        entityId: division.id,
        oldValue: { name: current.name, isActive: current.isActive },
        newValue: { name: division.name, isActive: division.isActive },
      });
    }
    return division;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function deleteDivision(id: string, actorId: string) {
  await prisma.$transaction(async (transaction) => {
    const division = await transaction.division.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!division) throw new Error("Divisi tidak ditemukan.");

    const [membershipCount, managerCount, sessionCount] = await Promise.all([
      transaction.membership.count({ where: { division: division.name } }),
      transaction.user.count({ where: { managedDivision: division.name } }),
      transaction.session.count({ where: { division: division.name } }),
    ]);
    if (membershipCount || managerCount || sessionCount) {
      throw new Error("Divisi masih digunakan. Nonaktifkan divisi agar riwayat tetap aman.");
    }

    await transaction.division.delete({ where: { id } });
    await writeAuditLog(transaction, {
      actorId,
      action: "division.deleted",
      entity: "division",
      entityId: division.id,
      oldValue: { name: division.name },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
