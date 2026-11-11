import "server-only";
import type { SessionStatus } from "@/components/attendance/attendance-data";
import { prisma } from "@/lib/prisma";

export type SuperAdminDashboardData = {
  periodName: string | null;
  activeMemberCount: number;
  totalMemberCount: number;
  sessionCount: number;
  attendanceRate: number | null;
  attendanceByMonth: Array<{ label: string; percentage: number; sessionCount: number }>;
  recentSessions: Array<{
    id: string;
    title: string;
    division: string | null;
    date: string;
    status: SessionStatus;
    presentCount: number;
    eligibleMemberCount: number;
  }>;
};

export type DivisionDashboardData = SuperAdminDashboardData & {
  divisionName: string | null;
};

const sessionStatuses: Record<"DRAFT" | "ACTIVE" | "CLOSED", SessionStatus> = {
  DRAFT: "Draft",
  ACTIVE: "Aktif",
  CLOSED: "Ditutup",
};

function getJakartaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    date: `${values.year}-${values.month}-${values.day}`,
  };
}

function getMonthStart(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
}

function addDays(date: string, count: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export async function getSuperAdminDashboardData(): Promise<SuperAdminDashboardData> {
  const today = getJakartaDateParts(new Date());
  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!activePeriod) {
    return {
      periodName: null,
      activeMemberCount: 0,
      totalMemberCount: 0,
      sessionCount: 0,
      attendanceRate: null,
      attendanceByMonth: [],
      recentSessions: [],
    };
  }

  const [memberships, sessionGroups, periodAttendance] = await Promise.all([
    prisma.membership.groupBy({
      by: ["division", "status"],
      where: { periodId: activePeriod.id },
      _count: { _all: true },
    }),
    prisma.session.groupBy({
      by: ["status"],
      where: { periodId: activePeriod.id },
      _count: { _all: true },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        session: {
          periodId: activePeriod.id,
          status: "CLOSED",
        },
      },
      _count: { _all: true },
    }),
  ]);
  const activeMembersByDivision = new Map<string, number>();
  let totalMemberCount = 0;
  let activeMemberCount = 0;
  for (const membership of memberships) {
    totalMemberCount += membership._count._all;
    if (membership.status === "ACTIVE") {
      activeMemberCount += membership._count._all;
      activeMembersByDivision.set(
        membership.division,
        (activeMembersByDivision.get(membership.division) ?? 0) +
          membership._count._all,
      );
    }
  }
  const sessionCount = sessionGroups.reduce(
    (total, group) => total + group._count._all,
    0,
  );
  const totalPeriodAttendance = periodAttendance.reduce(
    (total, group) => total + group._count._all,
    0,
  );
  const totalPeriodPresent = periodAttendance
    .filter(({ status }) => status === "PRESENT")
    .reduce((total, group) => total + group._count._all, 0);

  const firstMonth = getMonthStart(today.year, today.month - 5);
  const periodStartDate = activePeriod.startDate.toISOString().slice(0, 10);
  const periodEndDate = activePeriod.endDate.toISOString().slice(0, 10);
  const chartStartDate =
    firstMonth > periodStartDate ? firstMonth : periodStartDate;
  const chartEndDate = today.date < periodEndDate ? today.date : periodEndDate;
  const [sessions, recentSessionRows] = await Promise.all([
    chartStartDate <= chartEndDate
      ? prisma.session.findMany({
          where: {
            periodId: activePeriod.id,
            scheduledAt: {
              gte: new Date(`${chartStartDate}T00:00:00+07:00`),
              lt: new Date(`${addDays(chartEndDate, 1)}T00:00:00+07:00`),
            },
          },
          orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            division: true,
            scheduledAt: true,
            status: true,
            attendances: { select: { status: true } },
          },
        })
      : Promise.resolve([]),
    prisma.session.findMany({
      where: { periodId: activePeriod.id },
      orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        division: true,
        scheduledAt: true,
        status: true,
        attendances: { select: { status: true } },
      },
    }),
  ]);

  const closedSessions = sessions.filter(({ status }) => status === "CLOSED");
  const monthTotals = new Map<string, { present: number; possible: number; count: number }>();
  for (let offset = 0; offset < 6; offset += 1) {
    const monthDate = new Date(Date.UTC(today.year, today.month - 1 - offset, 1));
    const key = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    monthTotals.set(key, { present: 0, possible: 0, count: 0 });
  }

  for (const session of closedSessions) {
    const eligible = session.attendances.length;
    const present = session.attendances.filter(
      ({ status }) => status === "PRESENT",
    ).length;

    const sessionDate = getJakartaDateParts(session.scheduledAt);
    const key = `${sessionDate.year}-${String(sessionDate.month).padStart(2, "0")}`;
    const totals = monthTotals.get(key);
    if (totals) {
      totals.present += present;
      totals.possible += eligible;
      totals.count += 1;
    }
  }

  const attendanceByMonth = [...monthTotals.entries()]
    .map(([key, totals]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        label: formatMonthLabel(year, month),
        percentage: totals.possible
          ? Math.round((totals.present / totals.possible) * 100)
          : 0,
        sessionCount: totals.count,
      };
    })
    .reverse();

  const recentSessions = recentSessionRows.map((session) => {
    const eligibleMemberCount =
      session.status === "CLOSED"
        ? session.attendances.length
        : session.division === null
          ? activeMemberCount
          : activeMembersByDivision.get(session.division) ?? 0;
    return {
      id: session.id,
      title: session.title,
      division: session.division,
      date: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(session.scheduledAt),
      status: sessionStatuses[session.status],
      presentCount: session.attendances.filter(
        ({ status }) => status === "PRESENT",
      ).length,
      eligibleMemberCount,
    };
  });

  return {
    periodName: activePeriod.name,
    activeMemberCount,
    totalMemberCount,
    sessionCount,
    attendanceRate: totalPeriodAttendance > 0
      ? Math.round((totalPeriodPresent / totalPeriodAttendance) * 100)
      : null,
    attendanceByMonth,
    recentSessions,
  };
}

export async function getDivisionDashboardData(
  divisionName: string | null,
): Promise<DivisionDashboardData> {
  const today = getJakartaDateParts(new Date());
  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
    },
  });
  const emptyData = {
    periodName: activePeriod?.name ?? null,
    divisionName,
    activeMemberCount: 0,
    totalMemberCount: 0,
    sessionCount: 0,
    attendanceRate: null,
    attendanceByMonth: [],
    recentSessions: [],
  } satisfies DivisionDashboardData;

  if (!activePeriod || !divisionName) return emptyData;

  const divisionFilter = {
    periodId: activePeriod.id,
    division: divisionName,
  };
  const [memberships, sessionGroups, periodAttendance] = await Promise.all([
    prisma.membership.groupBy({
      by: ["status"],
      where: divisionFilter,
      _count: { _all: true },
    }),
    prisma.session.groupBy({
      by: ["status"],
      where: divisionFilter,
      _count: { _all: true },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: {
        session: {
          ...divisionFilter,
          status: "CLOSED",
        },
      },
      _count: { _all: true },
    }),
  ]);
  let activeMemberCount = 0;
  let totalMemberCount = 0;
  for (const membership of memberships) {
    totalMemberCount += membership._count._all;
    if (membership.status === "ACTIVE") {
      activeMemberCount = membership._count._all;
    }
  }
  const sessionCount = sessionGroups.reduce(
    (total, group) => total + group._count._all,
    0,
  );
  const totalPeriodAttendance = periodAttendance.reduce(
    (total, group) => total + group._count._all,
    0,
  );
  const totalPeriodPresent = periodAttendance
    .filter(({ status }) => status === "PRESENT")
    .reduce((total, group) => total + group._count._all, 0);

  const firstMonth = getMonthStart(today.year, today.month - 5);
  const periodStartDate = activePeriod.startDate.toISOString().slice(0, 10);
  const periodEndDate = activePeriod.endDate.toISOString().slice(0, 10);
  const chartStartDate =
    firstMonth > periodStartDate ? firstMonth : periodStartDate;
  const chartEndDate = today.date < periodEndDate ? today.date : periodEndDate;
  const [sessions, recentSessionRows] = await Promise.all([
    chartStartDate <= chartEndDate
      ? prisma.session.findMany({
          where: {
            ...divisionFilter,
            scheduledAt: {
              gte: new Date(`${chartStartDate}T00:00:00+07:00`),
              lt: new Date(`${addDays(chartEndDate, 1)}T00:00:00+07:00`),
            },
          },
          orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
          select: {
            scheduledAt: true,
            status: true,
            attendances: { select: { status: true } },
          },
        })
      : Promise.resolve([]),
    prisma.session.findMany({
      where: divisionFilter,
      orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        status: true,
        attendances: { select: { status: true } },
      },
    }),
  ]);
  const monthTotals = new Map<
    string,
    { present: number; possible: number; count: number }
  >();
  for (let offset = 0; offset < 6; offset += 1) {
    const monthDate = new Date(
      Date.UTC(today.year, today.month - 1 - offset, 1),
    );
    const key = `${monthDate.getUTCFullYear()}-${String(
      monthDate.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    monthTotals.set(key, { present: 0, possible: 0, count: 0 });
  }

  for (const session of sessions) {
    if (session.status !== "CLOSED") continue;
    const present = session.attendances.filter(
      ({ status }) => status === "PRESENT",
    ).length;
    const sessionDate = getJakartaDateParts(session.scheduledAt);
    const key = `${sessionDate.year}-${String(sessionDate.month).padStart(2, "0")}`;
    const totals = monthTotals.get(key);
    if (totals) {
      totals.present += present;
      totals.possible += session.attendances.length;
      totals.count += 1;
    }
  }

  const attendanceByMonth = [...monthTotals.entries()]
    .map(([key, totals]) => {
      const [year, month] = key.split("-").map(Number);
      return {
        label: formatMonthLabel(year, month),
        percentage: totals.possible
          ? Math.round((totals.present / totals.possible) * 100)
          : 0,
        sessionCount: totals.count,
      };
    })
    .reverse();
  const recentSessions = recentSessionRows.map((session) => ({
    id: session.id,
    title: session.title,
    division: divisionName,
    date: new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(session.scheduledAt),
    status: sessionStatuses[session.status],
    presentCount: session.attendances.filter(
      ({ status }) => status === "PRESENT",
    ).length,
    eligibleMemberCount:
      session.status === "CLOSED"
        ? session.attendances.length
        : activeMemberCount,
  }));

  return {
    periodName: activePeriod.name,
    divisionName,
    activeMemberCount,
    totalMemberCount,
    sessionCount,
    attendanceRate:
      totalPeriodAttendance > 0
        ? Math.round((totalPeriodPresent / totalPeriodAttendance) * 100)
        : null,
    attendanceByMonth,
    recentSessions,
  };
}

export async function getActivePeriodName() {
  const activePeriod = await prisma.period.findFirst({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
    select: { name: true },
  });
  return activePeriod?.name ?? null;
}
