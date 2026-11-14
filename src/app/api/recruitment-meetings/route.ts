import { ApplicantMeetingMode } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  chooseRecruitmentMeeting,
  createRecruitmentMeetingSession,
  getCandidateMeetingData,
  getRecruitmentMeetingOverview,
  RecruitmentMeetingError,
  updateRecruitmentZoomSettings,
} from "@/lib/recruitment-meeting-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readBody(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 16_384) {
    return { error: "Permintaan terlalu besar." } as const;
  }
  try {
    const body: unknown = await request.json();
    return isRecord(body)
      ? { body }
      : { error: "Format permintaan tidak valid." } as const;
  } catch {
    return { error: "Format permintaan tidak valid." } as const;
  }
}

export async function GET() {
  const access = await getApiUser(["super-admin", "admin", "calon-anggota"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Silakan masuk untuk melihat informasi pertemuan." },
      { status: access.status },
    );
  }

  try {
    const data =
      access.user.role === "calon-anggota"
        ? await getCandidateMeetingData(access.user.id)
        : await getRecruitmentMeetingOverview();
    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Recruitment meetings lookup failed.", error);
    return NextResponse.json(
      { error: "Data pertemuan gagal dimuat." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin", "admin", "calon-anggota"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Silakan masuk sebelum mengubah pilihan pertemuan." },
      { status: access.status },
    );
  }
  const parsed = await readBody(request);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    if (access.user.role === "calon-anggota") {
      if (
        parsed.body.meetingMode !== ApplicantMeetingMode.IN_PERSON &&
        parsed.body.meetingMode !== ApplicantMeetingMode.ONLINE
      ) {
        return NextResponse.json(
          { error: "Pilihan pertemuan tidak valid." },
          { status: 400 },
        );
      }
      await chooseRecruitmentMeeting(access.user.id, {
        meetingMode: parsed.body.meetingMode,
        ...(typeof parsed.body.meetingSessionId === "string"
          ? { meetingSessionId: parsed.body.meetingSessionId }
          : {}),
      });
      return NextResponse.json({ saved: true });
    }

    if (parsed.body.kind === "settings") {
      if (
        typeof parsed.body.zoomEnabled !== "boolean" ||
        typeof parsed.body.zoomUrl !== "string"
      ) {
        return NextResponse.json(
          { error: "Pengaturan Zoom tidak valid." },
          { status: 400 },
        );
      }
      const settings = await updateRecruitmentZoomSettings(
        {
          zoomEnabled: parsed.body.zoomEnabled,
          zoomUrl: parsed.body.zoomUrl,
        },
        access.user.id,
      );
      return NextResponse.json({ settings });
    }

    const session = await createRecruitmentMeetingSession(
      {
        title: typeof parsed.body.title === "string" ? parsed.body.title : "",
        startsAt: typeof parsed.body.startsAt === "string" ? parsed.body.startsAt : "",
        endsAt: typeof parsed.body.endsAt === "string" ? parsed.body.endsAt : "",
        location: typeof parsed.body.location === "string" ? parsed.body.location : "",
        capacity:
          typeof parsed.body.capacity === "number" ? parsed.body.capacity : Number.NaN,
      },
      access.user.id,
    );
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof RecruitmentMeetingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Recruitment meeting update failed.", error);
    return NextResponse.json(
      { error: "Perubahan jadwal pertemuan gagal disimpan." },
      { status: 500 },
    );
  }
}
