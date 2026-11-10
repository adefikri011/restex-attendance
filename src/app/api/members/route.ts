import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { validateMemberInput } from "@/lib/member-input";
import { createMembers } from "@/lib/member-service";

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk membuat anggota." },
      { status: access.status },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json(
      { error: "Permintaan terlalu besar." },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  const validation = validateMemberInput(body);
  if (validation.input === null) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const [member] = await createMembers([validation.input]);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : null;

    if (error instanceof Error && error.message.startsWith("NIM sudah terdaftar:")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (
      error instanceof Error &&
      error.message.startsWith("Tidak ada periode aktif.")
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Data anggota sudah terdaftar. Periksa NIM dan email." },
        { status: 409 },
      );
    }

    console.error("Member account creation failed.", {
      code: typeof code === "string" ? code : "unknown",
    });
    return NextResponse.json(
      { error: "Akun anggota gagal dibuat. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
