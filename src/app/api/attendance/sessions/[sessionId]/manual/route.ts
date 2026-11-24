import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  recordAttendanceManually,
} from "@/lib/attendance-service";
import type { AttendanceStatus } from "@/components/attendance/attendance-data";

const statuses: AttendanceStatus[] = ["Hadir", "Izin", "Sakit", "Alpha"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/attendance/sessions/[sessionId]/manual">,
) {
  const access = await getApiUser(["super-admin", "admin", "ketua-divisi", "pj-divisi"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya pengurus yang dapat mencatat absensi." },
      { status: access.status },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  if (
    !isRecord(body) ||
    typeof body.memberCode !== "string" ||
    typeof body.status !== "string" ||
    !statuses.includes(body.status as AttendanceStatus) ||
    (body.reason !== undefined && typeof body.reason !== "string")
  ) {
    return NextResponse.json({ error: "Data kehadiran tidak valid." }, { status: 400 });
  }

  const { sessionId } = await context.params;
  try {
    const attendance = await recordAttendanceManually(
      sessionId,
      body.memberCode,
      body.status as AttendanceStatus,
      typeof body.reason === "string" ? body.reason.trim() : "",
      access.user,
    );
    return NextResponse.json({ attendance });
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes("tidak berlaku") ||
      error.message.includes("terlalu panjang") ||
      error.message.includes("tidak ditemukan")
    )) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Manual attendance recording failed.", error);
    return NextResponse.json(
      { error: "Kehadiran gagal disimpan. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
