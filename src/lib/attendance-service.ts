import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import type { AppRoleId } from "@/components/auth/role-config";
import { getMembersPageData } from "@/lib/member-service";
import { prisma } from "@/lib/prisma";
import { hashAttendanceQrToken, verifyAttendanceQrToken } from "@/lib/attendance-qr-token";
import type {
  ActivityType,
  AttendanceMember,
  AttendanceEntry,
  AttendanceSession,
  AttendanceStatus,
  NewSessionInput,
} from "@/components/attendance/attendance-data";

type AttendanceViewer = {
  id: string;
  name: string;
  role: AppRoleId;
  managedDivision: string | null;
};

const databaseActivityType: Record<ActivityType, "ROUTINE" | "WORKSHOP" | "SEMINAR" | "INTERNAL" | "OTHER"> = {
  Rutin: "ROUTINE",
  Workshop: "WORKSHOP",
  Seminar: "SEMINAR",
  Internal: "INTERNAL",
  Lainnya: "OTHER",
};

const activityTypeFromDatabase: Record<
  "ROUTINE" | "WORKSHOP" | "SEMINAR" | "INTERNAL" | "OTHER",
  ActivityType
> = {
  ROUTINE: "Rutin",
  WORKSHOP: "Workshop",
  SEMINAR: "Seminar",
  INTERNAL: "Internal",
  OTHER: "Lainnya",
};

const statusFromDatabase: Record<
  "DRAFT" | "ACTIVE" | "CLOSED",
  AttendanceSession["status"]
> = {
  DRAFT: "Draft",
  ACTIVE: "Aktif",
  CLOSED: "Ditutup",
};

const attendanceStatusFromDatabase: Record<
  "PRESENT" | "EXCUSED" | "SICK" | "ABSENT",
  AttendanceStatus
> = {
  PRESENT: "Hadir",
  EXCUSED: "Izin",
  SICK: "Sakit",
  ABSENT: "Alpha",
};

const membershipStatusFromDatabase: Record<
  "ACTIVE" | "ON_LEAVE" | "EXITED" | "ALUMNI",
  AttendanceMember["status"]
> = {
  ACTIVE: "Aktif",
  ON_LEAVE: "Cuti",
  EXITED: "Keluar",
  ALUMNI: "Alumni",
};

function getViewerDivision(viewer: AttendanceViewer) {
  if (viewer.role === "ketua-divisi" || viewer.role === "pj-divisi") {
    if (!viewer.managedDivision) throw new Error("Akun belum ditugaskan ke divisi.");
    return viewer.managedDivision;
  }
  return undefined;
}

function toLocalDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${value.year}-${value.month}-${value.day}`,
    time: `${value.hour}:${value.minute}`,
  };
}

function mapAttendanceEntry(entry: {
  member: { memberCode: string };
  status: "PRESENT" | "EXCUSED" | "SICK" | "ABSENT";
  method: "QR" | "MANUAL";
  reason: string | null;
  recordedAt: Date;
  recordedBy?: { name: string } | null;
}): AttendanceEntry {
  return {
    memberId: entry.member.memberCode,
    status: attendanceStatusFromDatabase[entry.status],
    method: entry.method === "QR" ? "QR" : "Manual",
    reason: entry.reason ?? undefined,
    time: new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(entry.recordedAt),
    recordedBy: entry.recordedBy?.name,
  };
}

function mapSession(session: {
  id: string;
  title: string;
  type: "ROUTINE" | "WORKSHOP" | "SEMINAR" | "INTERNAL" | "OTHER";
  scheduledAt: Date;
  location: string;
  notes: string | null;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  division: string | null;
  createdBy?: { name: string } | null;
  attendances: Array<{
    member: { memberCode: string };
    status: "PRESENT" | "EXCUSED" | "SICK" | "ABSENT";
    method: "QR" | "MANUAL";
    reason: string | null;
    recordedAt: Date;
    recordedBy?: { name: string } | null;
  }>;
}): AttendanceSession {
  const scheduled = toLocalDateTime(session.scheduledAt);
  return {
    id: session.id,
    title: session.title,
    type: activityTypeFromDatabase[session.type],
    date: scheduled.date,
    time: scheduled.time,
    location: session.location,
    notes: session.notes ?? "",
    status: statusFromDatabase[session.status],
    division: session.division,
    createdBy: session.createdBy?.name,
    attendance: session.attendances.map(mapAttendanceEntry),
  };
}

export async function getAttendancePageData(viewer: AttendanceViewer) {
  const division = getViewerDivision(viewer);
  const [activePeriod, memberData] = await Promise.all([
    prisma.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { id: true, name: true },
    }),
    getMembersPageData(
      viewer.role === "ketua-divisi" || viewer.role === "pj-divisi" ? division ?? null : undefined,
    ),
  ]);
  if (!activePeriod) return { sessions: [], members: [], periodName: null, division };

  const rows = await prisma.session.findMany({
    where: {
      periodId: activePeriod.id,
      ...(division === undefined ? {} : { division }),
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
  });

  return {
    sessions: rows.map(mapSession),
    members: memberData.members.map(({ id, name, nim, division, status, photoUrl }) => ({
      id,
      name,
      nim,
      division,
      status,
      photoUrl,
    })),
    periodName: activePeriod.name,
    division,
  };
}

export async function getAttendanceSessionData(
  sessionId: string,
  viewer: AttendanceViewer,
) {
  const division = getViewerDivision(viewer);
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      ...(division === undefined ? {} : { division }),
    },
    select: {
      id: true,
      periodId: true,
      title: true,
      type: true,
      scheduledAt: true,
      location: true,
      notes: true,
      status: true,
      division: true,
      createdBy: { select: { name: true } },
      period: { select: { name: true } },
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
  });
  if (!session) return null;

  const memberRows = await prisma.member.findMany({
    where: {
      memberships: {
        some: {
          periodId: session.periodId,
          ...(session.division === null ? {} : { division: session.division }),
        },
      },
    },
    orderBy: { fullName: "asc" },
    select: {
      memberCode: true,
      fullName: true,
      nim: true,
      photoUrl: true,
      updatedAt: true,
      user: { select: { image: true } },
      memberships: {
        where: { periodId: session.periodId },
        take: 1,
        select: { division: true, status: true },
      },
    },
  });
  const members: AttendanceMember[] = memberRows.flatMap((row) => {
    const membership = row.memberships[0];
    if (!membership) return [];
    return [{
      id: row.memberCode,
      name: row.fullName,
      nim: row.nim,
      photoUrl: row.photoUrl && row.photoUrl !== row.user?.image
        ? `/api/members/${encodeURIComponent(row.memberCode)}/photo?v=${row.updatedAt.getTime()}`
        : null,
      division: membership.division,
      status: membershipStatusFromDatabase[membership.status],
    }];
  });
  return {
    session: mapSession(session),
    members,
    periodName: session.period.name,
    canManage: viewer.role === "ketua-divisi" || viewer.role === "pj-divisi",
  };
}

export async function createAttendanceSession(
  input: NewSessionInput,
  viewer: AttendanceViewer,
) {
  const division = getViewerDivision(viewer);
  if (!division || (viewer.role !== "ketua-divisi" && viewer.role !== "pj-divisi")) {
    throw new Error("Hanya Ketua Divisi atau PJ yang dapat membuka sesi.");
  }
  if (
    input.title.trim().length < 3 ||
    input.title.trim().length > 120 ||
    input.location.trim().length < 2 ||
    input.location.trim().length > 160 ||
    input.notes.length > 1000 ||
    !Object.hasOwn(databaseActivityType, input.type) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !/^\d{2}:\d{2}$/.test(input.time)
  ) {
    throw new Error("Data sesi tidak valid.");
  }
  const scheduledAt = new Date(`${input.date}T${input.time}:00+07:00`);
  if (
    Number.isNaN(scheduledAt.getTime()) ||
    toLocalDateTime(scheduledAt).date !== input.date ||
    toLocalDateTime(scheduledAt).time !== input.time
  ) {
    throw new Error("Jadwal sesi tidak valid.");
  }

  return prisma.$transaction(async (transaction) => {
    const activePeriod = await transaction.period.findFirst({
      where: { isActive: true },
      orderBy: { startDate: "desc" },
      select: { id: true },
    });
    if (!activePeriod) throw new Error("Tidak ada periode aktif.");
    const activeMemberCount = await transaction.membership.count({
      where: { periodId: activePeriod.id, division, status: "ACTIVE" },
    });
    if (!activeMemberCount) throw new Error("Divisi belum memiliki anggota aktif.");

    const currentSession = await transaction.session.findFirst({
      where: {
        periodId: activePeriod.id,
        division,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (currentSession) throw new Error("Divisi ini masih memiliki sesi aktif.");

    const session = await transaction.session.create({
      data: {
        id: randomUUID(),
        periodId: activePeriod.id,
        title: input.title.trim(),
        type: databaseActivityType[input.type],
        scheduledAt,
        location: input.location.trim(),
        notes: input.notes.trim() || null,
        division,
        status: "ACTIVE",
        createdById: viewer.id,
      },
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
          select: {
            status: true,
            method: true,
            reason: true,
            recordedAt: true,
            member: { select: { memberCode: true } },
          },
        },
      },
    });
    return mapSession(session);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function setAttendanceSessionStatus(
  sessionId: string,
  status: "ACTIVE" | "CLOSED",
  viewer: AttendanceViewer,
) {
  const division = getViewerDivision(viewer);
  if (!division || (viewer.role !== "ketua-divisi" && viewer.role !== "pj-divisi")) {
    throw new Error("Hanya Ketua Divisi atau PJ yang dapat mengelola sesi.");
  }
  return prisma.$transaction(async (transaction) => {
    const session = await transaction.session.findFirst({
      where: { id: sessionId, division },
      select: { id: true, periodId: true, division: true, status: true },
    });
    if (!session) throw new Error("Sesi tidak ditemukan.");
    if (session.status === "CLOSED") {
      throw new Error("Sesi yang sudah ditutup tidak dapat dibuka kembali.");
    }

    if (status === "CLOSED" && session.division) {
      const [members, recorded] = await Promise.all([
        transaction.membership.findMany({
          where: {
            periodId: session.periodId,
            division: session.division,
            status: "ACTIVE",
          },
          select: { memberId: true },
        }),
        transaction.attendance.findMany({
          where: { sessionId: session.id },
          select: { memberId: true },
        }),
      ]);
      const recordedIds = new Set(recorded.map(({ memberId }) => memberId));
      const unrecordedIds = members
        .map(({ memberId }) => memberId)
        .filter((memberId) => !recordedIds.has(memberId));
      if (unrecordedIds.length) {
        await transaction.attendance.createMany({
          data: unrecordedIds.map((memberId) => ({
            sessionId: session.id,
            memberId,
            status: "ABSENT",
            method: "MANUAL",
            reason: "Tidak tercatat sebelum sesi ditutup.",
            recordedById: viewer.id,
          })),
        });
      }
    }

    await transaction.session.update({
      where: { id: session.id },
      data: { status },
    });
    const updatedSession = await transaction.session.findUnique({
      where: { id: session.id },
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
    });
    if (!updatedSession) throw new Error("Sesi gagal diperbarui.");
    return mapSession(updatedSession);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function recordAttendanceByQr(
  sessionId: string,
  token: string,
  viewer: AttendanceViewer,
) {
  const division = getViewerDivision(viewer);
  if (!division || (viewer.role !== "ketua-divisi" && viewer.role !== "pj-divisi")) {
    throw new Error("Hanya Ketua Divisi atau PJ yang dapat mencatat absensi.");
  }
  const tokenData = verifyAttendanceQrToken(token);
  if (!tokenData) throw new Error("QR anggota tidak valid atau sudah kedaluwarsa.");
  const tokenHash = hashAttendanceQrToken(token);

  try {
    return await prisma.$transaction(async (transaction) => {
      const session = await transaction.session.findFirst({
        where: { id: sessionId, division, status: "ACTIVE" },
        select: { id: true, periodId: true },
      });
      if (!session) throw new Error("Sesi tidak ditemukan atau sudah ditutup.");

      const member = await transaction.member.findFirst({
        where: {
          id: tokenData.memberId,
          qrTokenHash: tokenHash,
          qrIssuedAt: new Date(tokenData.issuedAt),
          qrRevokedAt: null,
          memberships: {
            some: {
              periodId: session.periodId,
              division,
              status: "ACTIVE",
            },
          },
        },
        select: { id: true, memberCode: true, fullName: true },
      });
      if (!member) throw new Error("QR tidak berlaku untuk anggota aktif divisi ini.");

      await transaction.attendance.create({
        data: {
          sessionId: session.id,
          memberId: member.id,
          status: "PRESENT",
          method: "QR",
          recordedById: viewer.id,
        },
      });
      return {
        memberCode: member.memberCode,
        name: member.fullName,
        recordedBy: viewer.name,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Anggota ini sudah tercatat hadir pada sesi tersebut.");
    }
    throw error;
  }
}
