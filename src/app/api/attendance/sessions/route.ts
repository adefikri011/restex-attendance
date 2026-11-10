import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getApiUser } from "@/lib/auth-guard";
import { createAttendanceSession } from "@/lib/attendance-service";
import { activityTypes, type ActivityType } from "@/components/attendance/attendance-data";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isActivityType(value: string): value is ActivityType {
  return activityTypes.some((activityType) => activityType === value);
}

export async function POST(request: Request) {
  const access = await getApiUser(["ketua-divisi", "pj-divisi"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Ketua Divisi atau PJ yang dapat membuka sesi." },
      { status: access.status },
    );
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
    return NextResponse.json({ error: "Data sesi tidak valid." }, { status: 400 });
  }
  const { title, type, date, time, location, notes } = body;
  if (
    typeof title !== "string" ||
    typeof type !== "string" ||
    !isActivityType(type) ||
    typeof date !== "string" ||
    typeof time !== "string" ||
    typeof location !== "string" ||
    (notes !== undefined && typeof notes !== "string")
  ) {
    return NextResponse.json({ error: "Data sesi tidak valid." }, { status: 400 });
  }

  try {
    const session = await createAttendanceSession(
      {
        title,
        type,
        date,
        time,
        location,
        notes: typeof notes === "string" ? notes : "",
      },
      access.user,
    );
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Sesi divisi baru saja dibuka. Muat ulang halaman." },
        { status: 409 },
      );
    }
    if (error instanceof Error) {
      if (
        error.message.includes("aktif.") ||
        error.message.includes("sesi aktif") ||
        error.message.includes("anggota aktif")
      ) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("tidak valid")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    console.error("Attendance session creation failed.");
    return NextResponse.json(
      { error: "Sesi gagal dibuka. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
