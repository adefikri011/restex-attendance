import "server-only";
import type { AppRoleId } from "@/components/auth/role-config";
import type {
  ActivityType,
  AttendanceSession,
  AttendanceStatus,
  SessionStatus,
} from "@/components/attendance/attendance-data";
import type { Member, MembershipStatus } from "@/components/members/member-data";
import type {
  ReportPageData,
  ReportPeriodOption,
  ReportRange,
} from "@/components/reports/report-data";
import { prisma } from "@/lib/prisma";

type ReportViewer = {
  role: AppRoleId;
  managedDivision: string | null;
};

const sessionStatuses: Record<
  "DRAFT" | "ACTIVE" | "CLOSED",
  SessionStatus
> = {
  DRAFT: "Draft",
  ACTIVE: "Aktif",
  CLOSED: "Ditutup",
};

const attendanceStatuses: Record<
  "PRESENT" | "EXCUSED" | "SICK" | "ABSENT",
  AttendanceStatus
> = {
  PRESENT: "Hadir",
  EXCUSED: "Izin",
  SICK: "Sakit",
  ABSENT: "Alpha",
};

const activityTypes: Record<
  "ROUTINE" | "WORKSHOP" | "SEMINAR" | "INTERNAL" | "OTHER",
  ActivityType
> = {
  ROUTINE: "Rutin",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  INTERNAL: "Internal",
  OTHER: "Lainnya",
};

const membershipStatuses: Record<
  "ACTIVE" | "ON_LEAVE" | "EXITED" | "ALUMNI",
  MembershipStatus
> = {
  ACTIVE: "Aktif",
  ON_LEAVE: "Cuti",
  EXITED: "Keluar",
  ALUMNI: "Alumni",
};

function getJakartaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const date = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${date.year}-${date.month}-${date.day}`;
}

function addMonths(dateString: string, count: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const targetMonth = month - 1 + count;
  const lastDay = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, targetMonth, Math.min(day, lastDay)))
    .toISOString()
    .slice(0, 10);
}

function addDays(dateString: string, count: number) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

function getRangeDates(
  range: ReportRange,
  periodStart: string,
  periodEnd: string,
) {
  if (range === "Seluruh periode") return { startDate: periodStart, endDate: periodEnd };
  if (range === "Semester I") {
    const semesterEnd = addMonths(periodStart, 6);
    const inclusiveEnd = new Date(`${semesterEnd}T00:00:00.000Z`);
    inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() - 1);
    const endDate = inclusiveEnd.toISOString().slice(0, 10);
    return {
      startDate: periodStart,
      endDate: endDate < periodEnd ? endDate : periodEnd,
    };
  }

  const today = getJakartaDate();
  const monthStart = `${today.slice(0, 7)}-01`;
  const nextMonth = addMonths(monthStart, 1);
  const monthEnd = new Date(`${nextMonth}T00:00:00.000Z`);
  monthEnd.setUTCDate(monthEnd.getUTCDate() - 1);
  const lastDay = monthEnd.toISOString().slice(0, 10);
  return {
    startDate: monthStart > periodStart ? monthStart : periodStart,
    endDate: lastDay < periodEnd ? lastDay : periodEnd,
  };
}

function toJakartaDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function formatJoinedDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatPeriodStatus(
  isActive: boolean,
  endDate: Date,
  today: string,
) {
  if (isActive) return "Aktif";
  return endDate.toISOString().slice(0, 10) < today ? "Arsip" : "Rencana";
}

export async function getReportsPageData(
  viewer: ReportViewer,
  periodId: string | undefined,
  range: ReportRange,
): Promise<ReportPageData> {
  const today = getJakartaDate();
  const periods = await prisma.period.findMany({
    orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      isActive: true,
    },
  });
  const periodOptions: ReportPeriodOption[] = periods.map((period) => ({
    id: period.id,
    name: period.name,
    label: `${period.name} · ${formatPeriodStatus(period.isActive, period.endDate, today)}`,
    startDate: period.startDate.toISOString().slice(0, 10),
    endDate: period.endDate.toISOString().slice(0, 10),
  }));
  const selectedPeriod =
    periods.find(({ id }) => id === periodId) ??
    periods.find(({ isActive }) => isActive) ??
    periods[0];
  if (!selectedPeriod) {
    return { periods: periodOptions, selectedPeriodId: "", sessions: [], members: [] };
  }
  if (periodId && !periods.some(({ id }) => id === periodId)) {
    throw new Error("Periode tidak ditemukan.");
  }

  const startDate = selectedPeriod.startDate.toISOString().slice(0, 10);
  const endDate = selectedPeriod.endDate.toISOString().slice(0, 10);
  const selectedRange = getRangeDates(range, startDate, endDate);
  const hasRange = selectedRange.startDate <= selectedRange.endDate;
  const division =
    viewer.role === "ketua-divisi" || viewer.role === "pj-divisi"
      ? viewer.managedDivision
      : undefined;
  const scopedDivision = division ?? undefined;
  if (
    (viewer.role === "ketua-divisi" || viewer.role === "pj-divisi") &&
    !scopedDivision
  ) {
    return {
      periods: periodOptions,
      selectedPeriodId: selectedPeriod.id,
      sessions: [],
      members: [],
    };
  }
  const [memberRows, sessionRows] = await Promise.all([
    prisma.member.findMany({
      where: {
        memberships: {
          some: {
            periodId: selectedPeriod.id,
            status: "ACTIVE",
            ...(scopedDivision === undefined ? {} : { division: scopedDivision }),
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
        user: { select: { email: true, image: true } },
        memberships: {
          where: {
            periodId: selectedPeriod.id,
            status: "ACTIVE",
            ...(scopedDivision === undefined ? {} : { division: scopedDivision }),
          },
          take: 1,
          select: {
            division: true,
            status: true,
            joinedAt: true,
          },
        },
      },
    }),
    hasRange
      ? prisma.session.findMany({
          where: {
            periodId: selectedPeriod.id,
            scheduledAt: {
              gte: new Date(`${selectedRange.startDate}T00:00:00+07:00`),
              lt: new Date(`${addDays(selectedRange.endDate, 1)}T00:00:00+07:00`),
            },
            ...(scopedDivision === undefined ? {} : { division: scopedDivision }),
          },
          orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            type: true,
            scheduledAt: true,
            location: true,
            notes: true,
            status: true,
            division: true,
            createdBy: { select: { name: true } },
            attendances: {
              orderBy: { recordedAt: "asc" },
              select: {
                status: true,
                method: true,
                reason: true,
                recordedAt: true,
                member: { select: { memberCode: true } },
                recordedBy: { select: { name: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);
  const divisionMemberCounts = new Map<string, number>();
  const members: Member[] = memberRows.flatMap((member) => {
    const membership = member.memberships[0];
    if (!membership) return [];
    divisionMemberCounts.set(
      membership.division,
      (divisionMemberCounts.get(membership.division) ?? 0) + 1,
    );
    return [{
      id: member.memberCode,
      name: member.fullName,
      email: member.user?.email ?? "",
      photoUrl:
        member.photoUrl && member.photoUrl !== member.user?.image
          ? `/api/members/${encodeURIComponent(member.memberCode)}/photo?v=${member.updatedAt.getTime()}`
          : null,
      nim: member.nim,
      division: membership.division,
      cohort: member.cohort,
      status: membershipStatuses[membership.status],
      attendance: null,
      joinedAt: formatJoinedDate(membership.joinedAt),
    }];
  });

  const sessions: AttendanceSession[] = sessionRows.map((session) => {
    const scheduled = toJakartaDateTime(session.scheduledAt);
    return {
      id: session.id,
      title: session.title,
      type: activityTypes[session.type],
      date: scheduled.date,
      time: scheduled.time,
      location: session.location,
      notes: session.notes ?? "",
      status: sessionStatuses[session.status],
      division: session.division,
      eligibleMemberCount: session.division
        ? divisionMemberCounts.get(session.division) ?? 0
        : members.length,
      createdBy: session.createdBy.name,
      attendance: session.attendances.map((attendance) => ({
        memberId: attendance.member.memberCode,
        status: attendanceStatuses[attendance.status],
        method: attendance.method === "QR" ? "QR" : "Manual",
        reason: attendance.reason ?? undefined,
        time: toJakartaDateTime(attendance.recordedAt).time,
        recordedBy: attendance.recordedBy?.name,
      })),
    };
  });

  return {
    periods: periodOptions,
    selectedPeriodId: selectedPeriod.id,
    sessions,
    members,
  };
}
