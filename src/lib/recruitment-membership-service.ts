import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log-service";

function nextMemberCode(serial: number, year: number) {
  return `RTX-${year}-${String(serial).padStart(3, "0")}`;
}

export async function promoteAcceptedApplicant(
  transaction: Prisma.TransactionClient,
  applicationId: string,
  actorId: string,
) {
  const application = await transaction.recruitmentApplication.findUnique({
    where: { id: applicationId },
    select: {
      userId: true,
      fullName: true,
      nim: true,
      cohort: true,
      division: true,
      decision: true,
    },
  });
  if (!application) throw new Error("Pendaftar tidak ditemukan.");
  if (application.decision !== "ACCEPTED") return null;
  if (!application.division) {
    throw new Error(`Divisi untuk ${application.fullName} belum diisi.`);
  }
  const existingMember = await transaction.member.findUnique({
    where: { userId: application.userId },
    select: { memberCode: true },
  });
  if (existingMember) return existingMember.memberCode;

  const activePeriod = await transaction.period.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
    select: { id: true, startDate: true },
  });
  if (!activePeriod) {
    throw new Error("Tidak ada periode aktif untuk membuat anggota.");
  }

  const activeDivision = await transaction.division.findFirst({
    where: { name: application.division, isActive: true },
    select: { name: true },
  });
  if (!activeDivision) {
    throw new Error(`Divisi "${application.division}" tidak aktif atau tidak ditemukan.`);
  }

  const existingCodes = await transaction.member.findMany({
    where: {
      memberCode: { startsWith: `RTX-${activePeriod.startDate.getUTCFullYear()}-` },
    },
    select: { memberCode: true },
  });
  const nextSerial =
    existingCodes.reduce((largest, { memberCode }) => {
      const serial = Number(memberCode.split("-").at(-1));
      return Number.isInteger(serial) ? Math.max(largest, serial) : largest;
    }, 0) + 1;
  const memberCode = nextMemberCode(
    nextSerial,
    activePeriod.startDate.getUTCFullYear(),
  );
  const joinedAt = new Date();

  await transaction.user.update({
    where: { id: application.userId },
    data: { role: "MEMBER", isActive: true },
  });
  await transaction.member.create({
    data: {
      id: randomUUID(),
      memberCode,
      fullName: application.fullName,
      nim: application.nim,
      cohort: application.cohort,
      user: { connect: { id: application.userId } },
      memberships: {
        create: {
          id: randomUUID(),
          period: { connect: { id: activePeriod.id } },
          division: activeDivision.name,
          status: "ACTIVE",
          joinedAt,
        },
      },
    },
  });
  await writeAuditLog(transaction, {
    actorId,
    action: "member.created",
    entity: "member",
    entityId: memberCode,
    newValue: {
      name: application.fullName,
      memberCode,
      division: activeDivision.name,
      status: "ACTIVE",
      source: "recruitment",
    },
  });

  return memberCode;
}
