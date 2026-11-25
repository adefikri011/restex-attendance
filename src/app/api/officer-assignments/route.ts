import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getApiUser } from "@/lib/auth-guard";
import {
  createOfficerAssignment,
  deleteOfficerAssignment,
  getOfficerAssignmentData,
} from "@/lib/page-access-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET(request: Request) {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mengelola penugasan pengurus." },
      { status: access.status },
    );
  }
  const periodId = new URL(request.url).searchParams.get("periodId") ?? undefined;
  return NextResponse.json(await getOfficerAssignmentData(periodId));
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mengelola penugasan pengurus." },
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
  if (
    !isRecord(body) ||
    typeof body.memberId !== "string" ||
    typeof body.periodId !== "string" ||
    typeof body.position !== "string" ||
    (body.division !== null && typeof body.division !== "string")
  ) {
    return NextResponse.json({ error: "Data penugasan tidak valid." }, { status: 400 });
  }

  try {
    const assignment = await createOfficerAssignment(
      {
        memberId: body.memberId,
        periodId: body.periodId,
        position: body.position,
        division: body.division,
      },
      access.user.id,
    );
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Penugasan berubah bersamaan. Muat ulang lalu coba lagi." },
        { status: 409 },
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Officer assignment creation failed.");
    return NextResponse.json(
      { error: "Penugasan pengurus gagal disimpan." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mengelola penugasan pengurus." },
      { status: access.status },
    );
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID penugasan wajib diisi." }, { status: 400 });
  }
  try {
    await deleteOfficerAssignment(id, access.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Penugasan pengurus tidak ditemukan.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Officer assignment deletion failed.", error);
    return NextResponse.json(
      { error: "Penugasan pengurus gagal dihapus." },
      { status: 500 },
    );
  }
}
