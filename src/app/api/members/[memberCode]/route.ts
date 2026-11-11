import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { getDivisionNames } from "@/lib/division-service";
import { validateMemberInput } from "@/lib/member-input";
import { updateMember } from "@/lib/member-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberCode: string }> },
) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk mengubah data anggota." },
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

  const validation = validateMemberInput(body, await getDivisionNames(false));
  if (!validation.input) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { memberCode } = await context.params;
  try {
    const member = await updateMember(memberCode, validation.input, access.user.id);
    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NIM sudah terdaftar:")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes("Tidak ada periode aktif")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : null;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "NIM atau email tersebut sudah digunakan akun lain." },
        { status: 409 },
      );
    }

    console.error("Member update failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      code: typeof code === "string" ? code : "unknown",
    });
    return NextResponse.json(
      { error: "Data anggota gagal diperbarui. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
