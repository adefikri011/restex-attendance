import { NextResponse } from "next/server";
import { getApiUserForPage } from "@/lib/auth-guard";
import { setAttendanceSessionStatus } from "@/lib/attendance-service";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/attendance/officer-sessions/[sessionId]">,
) {
  const access = await getApiUserForPage("officer-attendance");
  if (!access.user) {
    return NextResponse.json(
      { error: "Akses absensi pengurus tidak tersedia untuk akun ini." },
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
    const session = await setAttendanceSessionStatus(sessionId, body.status, access.user);
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Akses absensi")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Officer attendance session status update failed.", error);
    return NextResponse.json(
      { error: "Status sesi pengurus gagal diperbarui. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
