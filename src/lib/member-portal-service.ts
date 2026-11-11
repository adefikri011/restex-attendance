import "server-only";
import type { AttendanceStatus } from "@/components/attendance/attendance-data";
import { prisma } from "@/lib/prisma";

type MemberSummary = {
  name: string;
  memberCode: string;
  nim: string;
  cohort: string;
  division: string | null;
  membershipStatus: "Aktif" | "Cuti" | "Keluar" | "Alumni" | null;
};

type MemberContext = {
  periodName: string | null;
  periodId: string | null;
  member: { id: string; summary: MemberSummary } | null;
};

export type MemberPortalData = {
  periodName: string | null;
  member: MemberSummary | null;
};

export type MemberAttendanceSummary = {
  periodName: string | null;
  memberName: string | null;
  attendanceSummary: Record<AttendanceStatus, number>;
  attendanceRate: number | null;
  totalAttendance: number;
};

export type MemberAttendanceHistory = {
  periodName: string | null;
  memberName: string | null;
  attendance: Array<{
    id: string;
    title: string;
    division: string | null;
    date: string;
    status: AttendanceStatus;
  }>;
};

const membershipStatuses = {
  ACTIVE: "Aktif",
  ON_LEAVE: "Cuti",
  EXITED: "Keluar",
  ALUMNI: "Alumni",
} as const;

const attendanceStatuses = {
  PRESENT: "Hadir",
  EXCUSED: "Izin",
  SICK: "Sakit",
  ABSENT: "Alpha",
} as const satisfies Record<
  "PRESENT" | "EXCUSED" | "SICK" | "ABSENT",
  AttendanceStatus
>;

function formatJakartaDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

async function getMemberContext(userId: string): Promise<MemberContext> {
  const [period, member] = await Promise.all([
    prisma.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }),
    prisma.member.findUnique({
      where: { userId },
      select: {
        id: true,
        fullName: true,
        memberCode: true,
        nim: true,
        cohort: true,
      },
    }),
  ]);

  if (!member) {
    return {
      periodName: period?.name ?? null,
      periodId: period?.id ?? null,
      member: null,
    };
  }

  const membership = period
    ? await prisma.membership.findUnique({
        where: {
          memberId_periodId: {
            memberId: member.id,
            periodId: period.id,
          },
        },
        select: { division: true, status: true },
      })
    : null;

  return {
    periodName: period?.name ?? null,
    periodId: period?.id ?? null,
    member: {
      id: member.id,
      summary: {
        name: member.fullName,
        memberCode: member.memberCode,
        nim: member.nim,
        cohort: member.cohort,
        division: membership?.division ?? null,
        membershipStatus: membership
          ? membershipStatuses[membership.status]
          : null,
      },
    },
  };
}

function emptyAttendanceSummary(): Record<AttendanceStatus, number> {
  return { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
}

export async function getMemberPortalData(
  userId: string,
): Promise<MemberPortalData> {
  const context = await getMemberContext(userId);
  return {
    periodName: context.periodName,
    member: context.member?.summary ?? null,
  };
}

export async function getMemberAttendanceSummary(
  userId: string,
): Promise<MemberAttendanceSummary> {
  const context = await getMemberContext(userId);
  const attendanceSummary = emptyAttendanceSummary();

  if (!context.member || !context.periodId) {
    return {
      periodName: context.periodName,
      memberName: context.member?.summary.name ?? null,
      attendanceSummary,
      attendanceRate: null,
      totalAttendance: 0,
    };
  }

  const groups = await prisma.attendance.groupBy({
    by: ["status"],
    where: {
      memberId: context.member.id,
      session: {
        periodId: context.periodId,
        status: "CLOSED",
      },
    },
    _count: { _all: true },
  });
  for (const group of groups) {
    attendanceSummary[attendanceStatuses[group.status]] = group._count._all;
  }
  const totalAttendance = groups.reduce(
    (total, group) => total + group._count._all,
    0,
  );

  return {
    periodName: context.periodName,
    memberName: context.member.summary.name,
    attendanceSummary,
    attendanceRate:
      totalAttendance > 0
        ? Math.round((attendanceSummary.Hadir / totalAttendance) * 100)
        : null,
    totalAttendance,
  };
}

export async function getMemberAttendanceHistory(
  userId: string,
): Promise<MemberAttendanceHistory> {
  const context = await getMemberContext(userId);
  if (!context.member || !context.periodId) {
    return {
      periodName: context.periodName,
      memberName: context.member?.summary.name ?? null,
      attendance: [],
    };
  }

  const records = await prisma.attendance.findMany({
    where: {
      memberId: context.member.id,
      session: {
        periodId: context.periodId,
        status: "CLOSED",
      },
    },
    orderBy: { session: { scheduledAt: "desc" } },
    take: 50,
    select: {
      id: true,
      status: true,
      session: {
        select: {
          title: true,
          division: true,
          scheduledAt: true,
        },
      },
    },
  });

  return {
    periodName: context.periodName,
    memberName: context.member.summary.name,
    attendance: records.map((record) => ({
      id: record.id,
      title: record.session.title,
      division: record.session.division,
      date: formatJakartaDate(record.session.scheduledAt),
      status: attendanceStatuses[record.status],
    })),
  };
}
