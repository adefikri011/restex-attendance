import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { recordAttendanceByQr } from "@/lib/attendance-service";

export async function POST(
  request: Request,
  context: RouteContext<"/api/attendance/sessions/[sessionId]/scan">,
) {
  const access = await getApiUser(["ketua-divisi", "pj-divisi"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Ketua Divisi atau PJ yang dapat mencatat absensi." },
      { status: access.status },
    );
  }

  if (Number(request.headers.get("content-length") ?? 0) > 2_048) {
    return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
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
    !("token" in body) ||
    typeof body.token !== "string" ||
    body.token.length > 512
  ) {
    return NextResponse.json({ error: "QR anggota tidak valid." }, { status: 400 });
  }

  const { sessionId } = await context.params;
  try {
    const attendance = await recordAttendanceByQr(sessionId, body.token, access.user);
    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Anggota ini sudah tercatat hadir pada sesi tersebut." },
        { status: 409 },
      );
    }
    if (error instanceof Error) {
      if (error.message.includes("sudah tercatat")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("tidak berlaku") || error.message.includes("QR anggota")) {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }
      if (error.message.includes("tidak ditemukan")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    console.error("QR attendance recording failed.");
    return NextResponse.json(
      { error: "Absensi gagal dicatat. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
