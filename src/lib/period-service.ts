import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { PeriodRecord, PeriodStatus } from "@/components/periods/periods-data";
import {
  getDefaultPeriodEndDate,
  getPeriodName,
} from "@/components/periods/periods-data";
import { writeAuditLog } from "@/lib/audit-log-service";
import { prisma } from "@/lib/prisma";

export type NewPeriodInput = {
  startDate: string;
  endDate: string;
};

export class PeriodInputError extends Error {}

export class PeriodConflictError extends Error {}

export class PeriodActivationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function getJakartaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(value: string, days: number) {
  const date = toDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function getPeriodStatus(
  isActive: boolean,
  endDate: Date,
  today: string,
): PeriodStatus {
  if (isActive) return "Aktif";
  return endDate.toISOString().slice(0, 10) <= today ? "Selesai" : "Akan datang";
}

export async function getPeriodsPageData() {
  const today = getJakartaDate();
  const periods = await prisma.period.findMany({
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      isActive: true,
      sessions: {
        select: {
          id: true,
          status: true,
          division: true,
        },
      },
    },
  });
  const periodIds = periods.map(({ id }) => id);
  const [memberships, attendance] = await Promise.all([
    prisma.membership.groupBy({
      by: ["periodId", "division", "status"],
      where: { periodId: { in: periodIds } },
      _count: { _all: true },
    }),
    periodIds.length
      ? prisma.attendance.groupBy({
          by: ["sessionId", "status"],
          where: {
            session: {
              periodId: { in: periodIds },
              status: "CLOSED",
            },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);
  const membershipCounts = new Map<string, { total: number; active: number }>();
  const membershipCountsByDivision = new Map<string, number>();
  for (const membership of memberships) {
    const periodCount = membershipCounts.get(membership.periodId) ?? {
      total: 0,
      active: 0,
    };
    periodCount.total += membership._count._all;
    if (membership.status === "ACTIVE") {
      periodCount.active += membership._count._all;
    }
    membershipCounts.set(membership.periodId, periodCount);

    const divisionKey = `${membership.periodId}:${membership.division}`;
    membershipCountsByDivision.set(
      divisionKey,
      (membershipCountsByDivision.get(divisionKey) ?? 0) + membership._count._all,
    );
  }
  const presentBySession = new Map<string, number>();
  for (const record of attendance) {
    if (record.status === "PRESENT") {
      presentBySession.set(
        record.sessionId,
        (presentBySession.get(record.sessionId) ?? 0) + record._count._all,
      );
    }
  }

  return {
    periods: periods.map((period): PeriodRecord => {
      const periodMemberships = membershipCounts.get(period.id) ?? { total: 0, active: 0 };
      const completedSessions = period.sessions.filter(
        ({ status }) => status === "CLOSED",
      );
      const { presentCount, possibleAttendance } = completedSessions.reduce(
        (totals, session) => {
          const eligibleMembers =
            session.division === null
              ? periodMemberships.total
              : membershipCountsByDivision.get(`${period.id}:${session.division}`) ?? 0;
          return {
            presentCount:
              totals.presentCount + (presentBySession.get(session.id) ?? 0),
            possibleAttendance: totals.possibleAttendance + eligibleMembers,
          };
        },
        { presentCount: 0, possibleAttendance: 0 },
      );

      return {
        id: period.id,
        name: getPeriodName(
          period.startDate.toISOString().slice(0, 10),
          period.endDate.toISOString().slice(0, 10),
        ),
        startDate: period.startDate.toISOString().slice(0, 10),
        endDate: period.endDate.toISOString().slice(0, 10),
        status: getPeriodStatus(period.isActive, period.endDate, today),
        memberCount: periodMemberships.total,
        activeMemberCount: periodMemberships.active,
        sessionCount: period.sessions.length,
        attendanceRate: possibleAttendance
          ? Math.round((presentCount / possibleAttendance) * 100)
          : 0,
      };
    }),
  };
}

export async function createPeriod(input: NewPeriodInput, actorId: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)
  ) {
    throw new PeriodInputError("Tanggal periode tidak valid.");
  }

  const startDate = toDate(input.startDate);
  const endDate = toDate(input.endDate);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate.toISOString().slice(0, 10) !== input.startDate ||
    endDate.toISOString().slice(0, 10) !== input.endDate
  ) {
    throw new PeriodInputError("Tanggal periode tidak valid.");
  }
  if (input.endDate <= input.startDate) {
    throw new PeriodInputError("Tanggal selesai harus setelah tanggal mulai.");
  }
  if (input.startDate <= getJakartaDate()) {
    throw new PeriodInputError("Periode baru harus dimulai setelah hari ini.");
  }

  const name = getPeriodName(input.startDate, input.endDate);
  return prisma.$transaction(async (transaction) => {
    const overlappingPeriod = await transaction.period.findFirst({
      where: {
        isActive: false,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      select: { id: true },
    });
    if (overlappingPeriod) {
      throw new PeriodConflictError(
        "Rentang tanggal bertabrakan dengan periode yang sudah ada.",
      );
    }

    const period = await transaction.period.create({
      data: {
        id: randomUUID(),
        name,
        startDate,
        endDate,
        isActive: false,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },
    });
    await writeAuditLog(transaction, {
      actorId,
      action: "period.created",
      entity: "period",
      entityId: period.id,
      newValue: {
        name: period.name,
        startDate: input.startDate,
        endDate: input.endDate,
        status: "Akan datang",
      },
    });
    return {
      id: period.id,
      name: getPeriodName(
        period.startDate.toISOString().slice(0, 10),
        period.endDate.toISOString().slice(0, 10),
      ),
      startDate: period.startDate.toISOString().slice(0, 10),
      endDate: period.endDate.toISOString().slice(0, 10),
      status: getPeriodStatus(period.isActive, period.endDate, getJakartaDate()),
      memberCount: 0,
      activeMemberCount: 0,
      sessionCount: 0,
      attendanceRate: 0,
    } satisfies PeriodRecord;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function activatePeriod(periodId: string, actorId: string) {
  const today = getJakartaDate();
  const activationDate = toDate(today);
  const previousDate = toDate(addDays(today, -1));

  await prisma.$transaction(async (transaction) => {
    const period = await transaction.period.findUnique({
      where: { id: periodId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
      },
    });
    if (!period) {
      throw new PeriodActivationError("Periode tidak ditemukan.", 404);
    }
    if (period.isActive) {
      throw new PeriodActivationError("Periode ini sudah aktif.", 409);
    }

    const originalStartDate = period.startDate.toISOString().slice(0, 10);
    const originalEndDate = period.endDate.toISOString().slice(0, 10);
    if (originalEndDate < today) {
      throw new PeriodActivationError(
        "Periode yang sudah selesai tidak dapat diaktifkan kembali.",
        409,
      );
    }

    const isEndDateAutomatic =
      originalEndDate === getDefaultPeriodEndDate(originalStartDate);
    const endDate = isEndDateAutomatic
      ? toDate(getDefaultPeriodEndDate(today))
      : period.endDate;
    const endDateString = endDate.toISOString().slice(0, 10);
    if (endDateString <= today) {
      throw new PeriodActivationError(
        "Tanggal selesai periode harus setelah tanggal aktivasi.",
        409,
      );
    }

    const overlappingPeriod = await transaction.period.findFirst({
      where: {
        id: { not: period.id },
        isActive: false,
        startDate: { lte: endDate },
        endDate: { gte: activationDate },
      },
      select: { id: true },
    });
    if (overlappingPeriod) {
      throw new PeriodActivationError(
        "Rentang tanggal bertabrakan dengan periode lain yang belum aktif.",
        409,
      );
    }

    const previousPeriods = await transaction.period.findMany({
      where: { isActive: true, id: { not: period.id } },
      select: { id: true, name: true, startDate: true, endDate: true },
    });
    for (const previousPeriod of previousPeriods) {
      const previousStart = previousPeriod.startDate.toISOString().slice(0, 10);
      if (previousStart > today) {
        throw new PeriodActivationError(
          "Periode aktif sebelumnya memiliki tanggal mulai di masa depan. Periksa datanya terlebih dahulu.",
          409,
        );
      }

      const closedEndDate = previousStart === today ? activationDate : previousDate;
      const closedName = getPeriodName(
        previousStart,
        closedEndDate.toISOString().slice(0, 10),
      );
      await transaction.period.update({
        where: { id: previousPeriod.id },
        data: {
          isActive: false,
          endDate: closedEndDate,
          name: closedName,
        },
      });
      await writeAuditLog(transaction, {
        actorId,
        action: "period.deactivated",
        entity: "period",
        entityId: previousPeriod.id,
        oldValue: {
          name: previousPeriod.name,
          startDate: previousStart,
          endDate: previousPeriod.endDate.toISOString().slice(0, 10),
          isActive: true,
        },
        newValue: {
          name: closedName,
          startDate: previousStart,
          endDate: closedEndDate.toISOString().slice(0, 10),
          isActive: false,
        },
      });
    }

    const name = getPeriodName(today, endDateString);
    const activated = await transaction.period.update({
      where: { id: period.id },
      data: {
        startDate: activationDate,
        endDate,
        name,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    });
    await writeAuditLog(transaction, {
      actorId,
      action: "period.activated",
      entity: "period",
      entityId: activated.id,
      oldValue: {
        name: period.name,
        startDate: originalStartDate,
        endDate: originalEndDate,
        isActive: false,
      },
      newValue: {
        name: activated.name,
        startDate: today,
        endDate: endDateString,
        isActive: true,
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
