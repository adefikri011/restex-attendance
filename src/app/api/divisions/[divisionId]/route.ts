import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { deleteDivision, updateDivision } from "@/lib/division-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ divisionId: string }> },
) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk mengubah divisi." },
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
    return NextResponse.json({ error: "Data divisi tidak valid." }, { status: 400 });
  }
  const input: { name?: string; isActive?: boolean } = {};
  if (typeof body.name === "string") input.name = body.name;
  if (typeof body.isActive === "boolean") input.isActive = body.isActive;
  if (!Object.keys(input).length) {
    return NextResponse.json({ error: "Tidak ada perubahan divisi." }, { status: 400 });
  }

  try {
    const { divisionId } = await context.params;
    if (!isUuid(divisionId)) {
      return NextResponse.json({ error: "ID divisi tidak valid." }, { status: 400 });
    }
    const division = await updateDivision(divisionId, input);
    return NextResponse.json({ division });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("karakter") ||
        error.message.includes("tidak ditemukan") ||
        error.message.includes("Ketua Divisi"))
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message.includes("tidak ditemukan") ? 404 : 409 },
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Nama divisi sudah digunakan." }, { status: 409 });
    }
    console.error("Division update failed.", error);
    return NextResponse.json({ error: "Divisi gagal diperbarui." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ divisionId: string }> },
) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk menghapus divisi." },
      { status: access.status },
    );
  }

  try {
    const { divisionId } = await context.params;
    if (!isUuid(divisionId)) {
      return NextResponse.json({ error: "ID divisi tidak valid." }, { status: 400 });
    }
    await deleteDivision(divisionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("masih digunakan")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Division deletion failed.", error);
    return NextResponse.json({ error: "Divisi gagal dihapus." }, { status: 500 });
  }
}
