import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  deleteRecruitmentMeetingSession,
  RecruitmentMeetingError,
  updateRecruitmentMeetingSession,
} from "@/lib/recruitment-meeting-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Admin dan Super Admin yang dapat mengubah sesi." },
      { status: access.status },
    );
  }
  const { meetingId } = await params;
  if (!isUuid(meetingId)) {
    return NextResponse.json({ error: "ID sesi tidak valid." }, { status: 400 });
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
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  if (typeof body.capacity !== "number" || typeof body.isActive !== "boolean") {
    return NextResponse.json(
      { error: "Kapasitas atau status sesi tidak valid." },
      { status: 400 },
    );
  }

  try {
    const session = await updateRecruitmentMeetingSession(
      meetingId,
      {
        capacity: body.capacity,
        isActive: body.isActive,
      },
      access.user.id,
    );
    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof RecruitmentMeetingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Recruitment meeting update failed.", error);
    return NextResponse.json(
      { error: "Sesi pertemuan gagal diperbarui." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Admin dan Super Admin yang dapat menghapus sesi." },
      { status: access.status },
    );
  }
  const { meetingId } = await params;
  if (!isUuid(meetingId)) {
    return NextResponse.json({ error: "ID sesi tidak valid." }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await deleteRecruitmentMeetingSession(meetingId, access.user.id),
    );
  } catch (error) {
    if (error instanceof RecruitmentMeetingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Recruitment meeting deletion failed.", error);
    return NextResponse.json(
      { error: "Sesi pertemuan gagal dihapus." },
      { status: 500 },
    );
  }
}
