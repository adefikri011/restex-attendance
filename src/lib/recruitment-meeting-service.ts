import "server-only";
import {
  ApplicantMeetingMode,
  ApplicantStage,
  Prisma,
} from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log-service";
import { prisma } from "@/lib/prisma";

export class RecruitmentMeetingError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

type MeetingSessionInput = {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: number;
};

function parseJakartaDateTime(value: string, field: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new RecruitmentMeetingError(`${field} tidak valid.`);
  }
  const date = new Date(`${value}:00+07:00`);
  const normalized = Number.isNaN(date.getTime())
    ? ""
    : new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16);
  if (!normalized || normalized !== value) {
    throw new RecruitmentMeetingError(`${field} tidak valid.`);
  }
  return date;
}

function validateMeetingSession(input: MeetingSessionInput) {
  if (
    typeof input.title !== "string" ||
    typeof input.startsAt !== "string" ||
    typeof input.endsAt !== "string" ||
    typeof input.location !== "string" ||
    !Number.isInteger(input.capacity)
  ) {
    throw new RecruitmentMeetingError("Data sesi pertemuan tidak lengkap.");
  }
  const title = input.title.trim();
  const location = input.location.trim();
  if (!title || title.length > 120) {
    throw new RecruitmentMeetingError("Nama sesi wajib diisi, maksimal 120 karakter.");
  }
  if (!location || location.length > 240) {
    throw new RecruitmentMeetingError("Lokasi wajib diisi, maksimal 240 karakter.");
  }
  if (input.capacity < 1 || input.capacity > 500) {
    throw new RecruitmentMeetingError("Kapasitas sesi harus antara 1 dan 500 orang.");
  }
  const startsAt = parseJakartaDateTime(input.startsAt, "Waktu mulai");
  const endsAt = parseJakartaDateTime(input.endsAt, "Waktu selesai");
  if (startsAt <= new Date()) {
    throw new RecruitmentMeetingError("Waktu sesi harus berada di masa mendatang.");
  }
  if (endsAt <= startsAt) {
    throw new RecruitmentMeetingError("Waktu selesai harus setelah waktu mulai.");
  }
  return { title, location, startsAt, endsAt, capacity: input.capacity };
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}

export async function getRecruitmentMeetingOverview() {
  const [sessions, onlineApplications, settings] = await Promise.all([
    prisma.recruitmentMeetingSession.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        _count: { select: { applications: true } },
        applications: {
          orderBy: { fullName: "asc" },
          select: {
            id: true,
            fullName: true,
            email: true,
            meetingAttendance: true,
          },
        },
      },
    }),
    prisma.recruitmentApplication.findMany({
      where: { meetingMode: ApplicantMeetingMode.ONLINE },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        meetingAttendance: true,
      },
    }),
    prisma.recruitmentSetting.findUnique({
      where: { id: "global" },
      select: { zoomEnabled: true, zoomUrl: true },
    }),
  ]);
  return {
    sessions: sessions.map(({ _count, ...session }) => ({
      ...session,
      bookedCount: _count.applications,
    })),
    onlineApplications,
    zoomEnabled: settings?.zoomEnabled ?? false,
    zoomUrl: settings?.zoomUrl ?? "",
  };
}

export async function createRecruitmentMeetingSession(
  input: MeetingSessionInput,
  actorId: string,
) {
  const data = validateMeetingSession(input);
  return prisma.$transaction(async (transaction) => {
    const session = await transaction.recruitmentMeetingSession.create({ data });
    await writeAuditLog(transaction, {
      actorId,
      action: "recruitment.meeting_created",
      entity: "recruitment",
      entityId: session.id,
      newValue: {
        title: session.title,
        startsAt: session.startsAt.toISOString(),
        capacity: session.capacity,
      },
    });
    return session;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function updateRecruitmentMeetingSession(
  id: string,
  input: { capacity: number; isActive: boolean },
  actorId: string,
) {
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 500) {
    throw new RecruitmentMeetingError("Kapasitas sesi harus antara 1 dan 500 orang.");
  }
  if (typeof input.isActive !== "boolean") {
    throw new RecruitmentMeetingError("Status sesi tidak valid.");
  }

  return prisma.$transaction(async (transaction) => {
    const current = await transaction.recruitmentMeetingSession.findUnique({
      where: { id },
    });
    if (!current) throw new RecruitmentMeetingError("Sesi pertemuan tidak ditemukan.", 404);
    const bookedCount = await transaction.recruitmentApplication.count({
      where: { meetingSessionId: id },
    });
    if (input.capacity < bookedCount) {
      throw new RecruitmentMeetingError(
        `Kapasitas tidak dapat kurang dari ${bookedCount} calon yang sudah memilih sesi.`,
        409,
      );
    }

    const session = await transaction.recruitmentMeetingSession.update({
      where: { id },
      data: { capacity: input.capacity, isActive: input.isActive },
    });
    await writeAuditLog(transaction, {
      actorId,
      action: "recruitment.meeting_updated",
      entity: "recruitment",
      entityId: session.id,
      oldValue: {
        title: current.title,
        capacity: current.capacity,
        isActive: current.isActive,
      },
      newValue: {
        title: session.title,
        capacity: session.capacity,
        isActive: session.isActive,
      },
    });
    return session;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function deleteRecruitmentMeetingSession(id: string, actorId: string) {
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.recruitmentMeetingSession.findUnique({
      where: { id },
    });
    if (!current) {
      throw new RecruitmentMeetingError("Sesi pertemuan tidak ditemukan.", 404);
    }
    const bookedCount = await transaction.recruitmentApplication.count({
      where: { meetingSessionId: id },
    });
    if (bookedCount > 0) {
      throw new RecruitmentMeetingError(
        "Sesi yang sudah dipilih calon anggota tidak dapat dihapus. Nonaktifkan sesi jika diperlukan.",
        409,
      );
    }

    await transaction.recruitmentMeetingSession.delete({ where: { id } });
    await writeAuditLog(transaction, {
      actorId,
      action: "recruitment.meeting_deleted",
      entity: "recruitment",
      entityId: id,
      oldValue: { title: current.title },
    });
    return { deleted: true };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

function validateZoomUrl(value: string, enabled: boolean) {
  const url = value.trim();
  if (url.length > 2048) {
    throw new RecruitmentMeetingError("Tautan Zoom maksimal 2048 karakter.");
  }
  if (!url && !enabled) return "";
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol === "https:" &&
      parsed.username === "" &&
      parsed.password === ""
    ) {
      return url;
    }
  } catch {
    throw new RecruitmentMeetingError("Isi tautan Zoom HTTPS sebelum menampilkannya.");
  }
  throw new RecruitmentMeetingError("Tautan Zoom harus menggunakan HTTPS.");
}

export async function updateRecruitmentZoomSettings(
  input: { zoomEnabled: boolean; zoomUrl: string },
  actorId: string,
) {
  if (typeof input.zoomEnabled !== "boolean" || typeof input.zoomUrl !== "string") {
    throw new RecruitmentMeetingError("Pengaturan Zoom tidak valid.");
  }
  const zoomUrl = validateZoomUrl(input.zoomUrl, input.zoomEnabled);

  return prisma.$transaction(async (transaction) => {
    const previous = await transaction.recruitmentSetting.findUnique({
      where: { id: "global" },
      select: { zoomEnabled: true, zoomUrl: true },
    });
    const settings = await transaction.recruitmentSetting.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        zoomEnabled: input.zoomEnabled,
        zoomUrl,
      },
      update: { zoomEnabled: input.zoomEnabled, zoomUrl },
      select: { zoomEnabled: true, zoomUrl: true },
    });
    await writeAuditLog(transaction, {
      actorId,
      action: "recruitment.updated",
      entity: "recruitment",
      entityId: "global",
      oldValue: previous
        ? { name: "Pilihan Zoom", status: previous.zoomEnabled ? "Aktif" : "Nonaktif" }
        : undefined,
      newValue: {
        name: "Pilihan Zoom",
        status: settings.zoomEnabled ? "Aktif" : "Nonaktif",
        zoomUrl: settings.zoomUrl || "Tidak diatur",
      },
    });
    return settings;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function chooseRecruitmentMeeting(
  userId: string,
  input: { meetingMode: ApplicantMeetingMode; meetingSessionId?: string },
) {
  if (
    input.meetingMode !== ApplicantMeetingMode.IN_PERSON &&
    input.meetingMode !== ApplicantMeetingMode.ONLINE
  ) {
    throw new RecruitmentMeetingError("Pilihan pertemuan tidak valid.");
  }
  if (
    (input.meetingMode === ApplicantMeetingMode.IN_PERSON &&
      typeof input.meetingSessionId !== "string") ||
    (input.meetingMode === ApplicantMeetingMode.ONLINE && input.meetingSessionId)
  ) {
    throw new RecruitmentMeetingError("Pilih satu sesi pertemuan yang tersedia.");
  }
  const meetingSessionId = input.meetingSessionId;
  if (
    input.meetingMode === ApplicantMeetingMode.IN_PERSON &&
    (typeof meetingSessionId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        meetingSessionId,
      ))
  ) {
    throw new RecruitmentMeetingError("ID sesi pertemuan tidak valid.");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const application = await transaction.recruitmentApplication.findUnique({
        where: { userId },
        select: {
          id: true,
          stage: true,
          decision: true,
          meetingAttendance: true,
          meetingNotes: true,
        },
      });
      if (
        !application ||
        application.stage !== ApplicantStage.MEETING_INVITED ||
        application.decision
      ) {
        throw new RecruitmentMeetingError(
          "Pilihan sesi hanya tersedia untuk calon anggota yang sudah diundang.",
          403,
        );
      }
      if (application.meetingAttendance || application.meetingNotes) {
        throw new RecruitmentMeetingError(
          "Pilihan pertemuan sudah ditutup karena admin mulai mencatat hasil wawancara.",
          409,
        );
      }

      if (input.meetingMode === ApplicantMeetingMode.ONLINE) {
        const settings = await transaction.recruitmentSetting.findUnique({
          where: { id: "global" },
          select: { zoomEnabled: true, zoomUrl: true },
        });
        if (!settings?.zoomEnabled || !settings.zoomUrl) {
          throw new RecruitmentMeetingError(
            "Pilihan Zoom belum dibuka oleh admin.",
            409,
          );
        }
      } else {
        const session = await transaction.recruitmentMeetingSession.findUnique({
          where: { id: meetingSessionId },
          select: { id: true, startsAt: true, capacity: true, isActive: true },
        });
        if (!session?.isActive || session.startsAt <= new Date()) {
          throw new RecruitmentMeetingError("Sesi ini sudah tidak tersedia.", 409);
        }
        const bookedCount = await transaction.recruitmentApplication.count({
          where: {
            meetingSessionId: session.id,
            id: { not: application.id },
          },
        });
        if (bookedCount >= session.capacity) {
          throw new RecruitmentMeetingError(
            "Sesi ini sudah penuh. Pilih sesi lain yang masih tersedia.",
            409,
          );
        }
      }

      await transaction.recruitmentApplication.update({
        where: { id: application.id },
        data: {
          meetingMode: input.meetingMode,
          meetingSessionId:
            input.meetingMode === ApplicantMeetingMode.IN_PERSON
              ? meetingSessionId
              : null,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof RecruitmentMeetingError) throw error;
    if (getErrorCode(error) === "P2034") {
      throw new RecruitmentMeetingError(
        "Sesi baru saja penuh. Pilih sesi lain yang masih tersedia.",
        409,
      );
    }
    throw error;
  }
}

export async function getCandidateMeetingData(userId: string) {
  const application = await prisma.recruitmentApplication.findUnique({
    where: { userId },
    select: {
      id: true,
      stage: true,
      decision: true,
      updatedAt: true,
      meetingMode: true,
      meetingSession: {
        select: { id: true, title: true, startsAt: true, endsAt: true, location: true },
      },
    },
  });
  if (!application) return null;

  const canChoose =
    application.stage === ApplicantStage.MEETING_INVITED && !application.decision;
  const settings = canChoose || application.meetingMode === ApplicantMeetingMode.ONLINE
    ? await prisma.recruitmentSetting.findUnique({
        where: { id: "global" },
        select: { zoomEnabled: true, zoomUrl: true },
      })
    : null;
  const sessions = canChoose
    ? await prisma.recruitmentMeetingSession.findMany({
        where: { isActive: true, startsAt: { gt: new Date() } },
        orderBy: { startsAt: "asc" },
        include: {
          _count: {
            select: {
              applications: {
                where: { id: { not: application.id } },
              },
            },
          },
        },
      })
    : [];

  return {
    ...application,
    zoomEnabled: Boolean(settings?.zoomEnabled && settings.zoomUrl),
    zoomUrl:
      application.meetingMode === ApplicantMeetingMode.ONLINE
        ? settings?.zoomUrl ?? ""
        : "",
    sessions: sessions
      .filter(({ _count, capacity }) => _count.applications < capacity)
      .map(({ _count, ...session }) => ({
        ...session,
        bookedCount: _count.applications,
      })),
  };
}
