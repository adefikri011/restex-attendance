import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { createDivision, getDivisionsPageData } from "@/lib/division-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET() {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk mengelola divisi." },
      { status: access.status },
    );
  }

  return NextResponse.json({ divisions: await getDivisionsPageData() });
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk menambah divisi." },
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
  if (!isRecord(body) || typeof body.name !== "string") {
    return NextResponse.json({ error: "Nama divisi wajib diisi." }, { status: 400 });
  }

  try {
    const division = await createDivision(body.name, access.user.id);
    return NextResponse.json({ division }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("karakter")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Nama divisi sudah digunakan." }, { status: 409 });
    }
    console.error("Division creation failed.", error);
    return NextResponse.json({ error: "Divisi gagal ditambahkan." }, { status: 500 });
  }
}
