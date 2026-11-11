import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const access = await getApiUser();
  if (!access.user) {
    return NextResponse.json({ error: "Silakan masuk untuk mengubah profil." }, {
      status: access.status,
    });
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
    !("name" in body) ||
    typeof body.name !== "string"
  ) {
    return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
  }

  const name = body.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: "Nama harus terdiri dari 2–120 karakter." },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: access.user.id },
        data: { name },
      });
      await transaction.member.updateMany({
        where: { userId: access.user.id },
        data: { fullName: name },
      });
    });
    return NextResponse.json({ name });
  } catch (error) {
    console.error("Profile name update failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Nama profil gagal diperbarui. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
