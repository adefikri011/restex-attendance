import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { activityTypes, type ActivityType } from "@/components/attendance/attendance-data";
import { createAttendanceSession } from "@/lib/attendance-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isActivityType(value: string): value is ActivityType {
  return activityTypes.some((activityType) => activityType === value);
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Admin atau Super Admin yang dapat membuka sesi pengurus." },
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
    typeof body.title !== "string" ||
    typeof body.type !== "string" ||
    !isActivityType(body.type) ||
    typeof body.date !== "string" ||
    typeof body.time !== "string" ||
    typeof body.location !== "string" ||
    (body.notes !== undefined && typeof body.notes !== "string")
  ) {
    return NextResponse.json({ error: "Data sesi tidak valid." }, { status: 400 });
  }

  try {
    const session = await createAttendanceSession(
      {
        title: body.title,
        type: body.type,
        date: body.date,
        time: body.time,
        location: body.location,
        notes: typeof body.notes === "string" ? body.notes : "",
      },
      access.user,
      "officers",
    );
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json(
        { error: "Sesi pengurus baru saja dibuka. Muat ulang halaman." },
        { status: 409 },
      );
    }
    if (error instanceof Error && (error.message.includes("aktif") || error.message.includes("valid"))) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Officer attendance session creation failed.", error);
    return NextResponse.json(
      { error: "Sesi pengurus gagal dibuka. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
