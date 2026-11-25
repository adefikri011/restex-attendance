import { NextResponse } from "next/server";
import { getApiUserForAnyPage } from "@/lib/auth-guard";
import { getProfileImage, isProfileObjectKey, R2NotConfiguredError } from "@/lib/r2-storage";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ memberCode: string }> },
) {
  const access = await getApiUserForAnyPage(["members", "lanyard-card"]);
  if (!access.user) {
    return NextResponse.json({ error: "Akses foto anggota ditolak." }, { status: access.status });
  }

  const { memberCode } = await context.params;
  const managedDivision = access.user.managedDivision;
  const isDivisionManager =
    access.user.role === "ketua-divisi" ||
    access.user.role === "pj-divisi" ||
    Boolean(managedDivision);
  if (isDivisionManager && !managedDivision) {
    return NextResponse.json({ error: "Akun belum ditugaskan ke divisi." }, { status: 403 });
  }
  if (isDivisionManager && !access.user.managedDivision) {
    return NextResponse.json({ error: "Akun belum ditugaskan ke divisi." }, { status: 403 });
  }

  const member = await prisma.member.findFirst({
    where: {
      memberCode,
      memberships: {
        some: {
          ...(managedDivision ? { division: managedDivision } : {}),
        },
      },
    },
    select: { photoUrl: true },
  });
  if (!member?.photoUrl || !isProfileObjectKey(member.photoUrl)) {
    return NextResponse.json({ error: "Foto anggota belum tersedia." }, { status: 404 });
  }

  try {
    const object = await getProfileImage(member.photoUrl);
    if (!object.Body) {
      return NextResponse.json({ error: "Foto anggota tidak ditemukan." }, { status: 404 });
    }

    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof R2NotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Member photo retrieval failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Foto anggota gagal dimuat." },
      { status: 502 },
    );
  }
}
