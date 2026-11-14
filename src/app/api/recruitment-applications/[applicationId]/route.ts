import {
  ApplicantDecision,
  ApplicantMeetingAttendance,
  ApplicantScreeningRating,
  ApplicantStage,
  Prisma,
} from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log-service";
import { getApiUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

class ApplicantUpdateError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function isApplicantStage(value: unknown): value is ApplicantStage {
  return typeof value === "string" && Object.values(ApplicantStage).includes(value as ApplicantStage);
}

function isApplicantDecision(value: unknown): value is ApplicantDecision | null {
  return (
    value === null ||
    (typeof value === "string" &&
      Object.values(ApplicantDecision).includes(value as ApplicantDecision))
  );
}

function isApplicantScreeningRating(
  value: unknown,
): value is ApplicantScreeningRating | null {
  return (
    value === null ||
    (typeof value === "string" &&
      Object.values(ApplicantScreeningRating).includes(
        value as ApplicantScreeningRating,
      ))
  );
}

function isApplicantMeetingAttendance(
  value: unknown,
): value is ApplicantMeetingAttendance | null {
  return (
    value === null ||
    (typeof value === "string" &&
      Object.values(ApplicantMeetingAttendance).includes(
        value as ApplicantMeetingAttendance,
      ))
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Admin dan Super Admin yang dapat memperbarui tahap seleksi." },
      { status: access.status },
    );
  }
  const { applicationId } = await params;
  if (!isUuid(applicationId)) {
    return NextResponse.json({ error: "ID pendaftar tidak valid." }, { status: 400 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > 16_384) {
    return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Format data seleksi tidak valid." },
      { status: 400 },
    );
  }

  const hasMeetingAttendance = Object.hasOwn(body, "meetingAttendance");
  const hasMeetingNotes = Object.hasOwn(body, "meetingNotes");
  if (hasMeetingAttendance || hasMeetingNotes) {
    if (
      (hasMeetingAttendance &&
        !isApplicantMeetingAttendance(body.meetingAttendance)) ||
      (hasMeetingNotes &&
        body.meetingNotes !== null &&
        (typeof body.meetingNotes !== "string" || body.meetingNotes.length > 3000))
    ) {
      return NextResponse.json(
        { error: "Kehadiran atau catatan pertemuan tidak valid." },
        { status: 400 },
      );
    }

    const meetingNotes =
      typeof body.meetingNotes === "string" ? body.meetingNotes.trim() || null : null;
    try {
      const application = await prisma.$transaction(async (transaction) => {
        const current = await transaction.recruitmentApplication.findUnique({
          where: { id: applicationId },
          select: {
            id: true,
            fullName: true,
            decision: true,
            meetingMode: true,
            meetingAttendance: true,
            meetingNotes: true,
          },
        });
        if (!current) return null;
        if (!current.meetingMode || current.decision !== null) {
          throw new ApplicantUpdateError(
            "Hasil pertemuan hanya dapat diubah untuk calon yang belum memiliki keputusan seleksi.",
            409,
          );
        }

        const data = {
          ...(hasMeetingAttendance
            ? { meetingAttendance: body.meetingAttendance as ApplicantMeetingAttendance | null }
            : {}),
          ...(hasMeetingNotes ? { meetingNotes } : {}),
        };
        const updated = await transaction.recruitmentApplication.update({
          where: { id: applicationId },
          data,
          select: {
            id: true,
            meetingAttendance: true,
            meetingNotes: true,
          },
        });
        if (
          current.meetingAttendance !== updated.meetingAttendance ||
          current.meetingNotes !== updated.meetingNotes
        ) {
          await writeAuditLog(transaction, {
            actorId: access.user.id,
            action: "recruitment.meeting_reviewed",
            entity: "recruitment",
            entityId: current.id,
            oldValue: {
              name: current.fullName,
              attendance: current.meetingAttendance ?? "Belum dicatat",
              notesUpdated: Boolean(current.meetingNotes),
            },
            newValue: {
              name: current.fullName,
              attendance: updated.meetingAttendance ?? "Belum dicatat",
              notesUpdated: Boolean(updated.meetingNotes),
            },
          });
        }
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      if (!application) {
        return NextResponse.json({ error: "Pendaftar tidak ditemukan." }, { status: 404 });
      }
      revalidatePath("/recruitment/meetings");
      revalidatePath("/recruitment/applicants");
      revalidatePath(`/recruitment/applicants/${applicationId}`);
      return NextResponse.json({ application });
    } catch (error) {
      if (error instanceof ApplicantUpdateError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("Recruitment applicant meeting review update failed.", error);
      return NextResponse.json(
        { error: "Kehadiran atau catatan pertemuan gagal disimpan." },
        { status: 500 },
      );
    }
  }

  if (Object.hasOwn(body, "screeningRating")) {
    if (!isApplicantScreeningRating(body.screeningRating)) {
      return NextResponse.json(
        { error: "Penilaian screening tidak valid." },
        { status: 400 },
      );
    }
    const screeningRating = body.screeningRating;
    try {
      const application = await prisma.$transaction(async (transaction) => {
        const current = await transaction.recruitmentApplication.findUnique({
          where: { id: applicationId },
          select: {
            id: true,
            fullName: true,
            stage: true,
            decision: true,
            screeningRating: true,
          },
        });
        if (!current) return null;
        if (
          current.decision !== null ||
          (current.stage !== ApplicantStage.SUBMITTED &&
            current.stage !== ApplicantStage.SCREENING)
        ) {
          throw new ApplicantUpdateError(
            "Penilaian hanya dapat diubah saat tahap screening.",
            409,
          );
        }

        const updated = await transaction.recruitmentApplication.update({
          where: { id: applicationId },
          data: { screeningRating },
          select: { id: true, screeningRating: true },
        });
        await writeAuditLog(transaction, {
          actorId: access.user.id,
          action: "recruitment.screening_rated",
          entity: "recruitment",
          entityId: current.id,
          oldValue: {
            name: current.fullName,
            status: current.screeningRating ?? "Belum dinilai",
          },
          newValue: {
            name: current.fullName,
            status: updated.screeningRating ?? "Belum dinilai",
          },
        });
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      if (!application) {
        return NextResponse.json({ error: "Pendaftar tidak ditemukan." }, { status: 404 });
      }
      revalidatePath("/recruitment/applicants");
      revalidatePath(`/recruitment/applicants/${applicationId}`);
      return NextResponse.json({ application });
    } catch (error) {
      if (error instanceof ApplicantUpdateError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      console.error("Recruitment applicant screening rating update failed.", error);
      return NextResponse.json(
        { error: "Penilaian screening gagal disimpan." },
        { status: 500 },
      );
    }
  }

  if (!isApplicantStage(body.stage) || !isApplicantDecision(body.decision)) {
    return NextResponse.json(
      { error: "Tahap atau keputusan seleksi tidak valid." },
      { status: 400 },
    );
  }

  const decision = body.decision;
  const stage = decision ? ApplicantStage.FINAL_REVIEW : body.stage;

  try {
    const application = await prisma.$transaction(async (transaction) => {
      const current = await transaction.recruitmentApplication.findUnique({
        where: { id: applicationId },
        select: {
          id: true,
          fullName: true,
          stage: true,
          decision: true,
        },
      });
      if (!current) return null;

      const updated = await transaction.recruitmentApplication.update({
        where: { id: applicationId },
        data: {
          stage,
          decision,
          ...(stage === ApplicantStage.SUBMITTED || stage === ApplicantStage.SCREENING
            ? {
                meetingMode: null,
                meetingSessionId: null,
                meetingAttendance: null,
                meetingNotes: null,
              }
            : {}),
        },
        select: { id: true, stage: true, decision: true },
      });
      await writeAuditLog(transaction, {
        actorId: access.user.id,
        action: "recruitment.applicant_updated",
        entity: "recruitment",
        entityId: current.id,
        oldValue: {
          name: current.fullName,
          status: current.decision ?? current.stage,
        },
        newValue: {
          name: current.fullName,
          status: updated.decision ?? updated.stage,
        },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (!application) {
      return NextResponse.json({ error: "Pendaftar tidak ditemukan." }, { status: 404 });
    }
    revalidatePath("/recruitment/applicants");
    revalidatePath(`/recruitment/applicants/${applicationId}`);
    revalidatePath("/portal/calon-anggota");
    return NextResponse.json({ application });
  } catch (error) {
    console.error("Recruitment applicant status update failed.", error);
    return NextResponse.json(
      { error: "Tahap seleksi gagal diperbarui." },
      { status: 500 },
    );
  }
}
