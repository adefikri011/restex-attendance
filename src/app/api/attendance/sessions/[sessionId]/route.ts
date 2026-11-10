import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { setAttendanceSessionStatus } from "@/lib/attendance-service";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/attendance/sessions/[sessionId]">,
) {
  const access = await getApiUser(["ketua-divisi", "pj-divisi"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Ketua Divisi atau PJ yang dapat mengelola sesi." },
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
    typeof body !== "object" ||
    body === null ||
    !("status" in body) ||
    (body.status !== "ACTIVE" && body.status !== "CLOSED")
  ) {
    return NextResponse.json({ error: "Status sesi tidak valid." }, { status: 400 });
  }

  const { sessionId } = await context.params;
  try {
    const session = await setAttendanceSessionStatus(
      sessionId,
      body.status,
      access.user,
    );
    return NextResponse.json({
      ok: true,
      session,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("tidak dapat dibuka kembali")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Attendance session status update failed.");
    return NextResponse.json(
      { error: "Status sesi gagal diperbarui. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
