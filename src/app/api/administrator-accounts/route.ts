import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  createAdministratorAccount,
  type NewAdministratorInput,
} from "@/lib/administrator-account-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat membuat akun pengurus." },
      { status: access.status },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Data akun tidak valid." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = body.role;
  const division = body.division;
  if (
    typeof role !== "string" ||
    (role !== "admin" && role !== "ketua-divisi") ||
    (division !== null && typeof division !== "string")
  ) {
    return NextResponse.json({ error: "Jabatan atau divisi tidak valid." }, { status: 400 });
  }

  try {
    const result = await createAdministratorAccount({
      name,
      role,
      division,
    } satisfies NewAdministratorInput);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("tidak ada periode aktif")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (
        error.message.includes("Nama harus") ||
        error.message.includes("tidak valid") ||
        error.message.includes("Email tidak")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("sudah memiliki Ketua Divisi")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    console.error("Administrator account creation failed.");
    return NextResponse.json(
      { error: "Akun pengurus gagal dibuat. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
