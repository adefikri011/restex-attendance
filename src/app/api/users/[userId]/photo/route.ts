import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  getProfileImage,
  isProfileObjectKey,
  R2NotConfiguredError,
} from "@/lib/r2-storage";
import { prisma } from "@/lib/prisma";

const accountRoles = ["SUPER_ADMIN", "ADMIN", "DIVISION_LEAD", "DIVISION_PJ"] as const;
const viewerRoles = ["super-admin"] as const;

export async function GET(
  _request: Request,
  context: RouteContext<"/api/users/[userId]/photo">,
) {
  const access = await getApiUser(viewerRoles);
  if (!access.user) {
    return NextResponse.json({ error: "Akses foto pengguna ditolak." }, {
      status: access.status,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { userId } = await context.params;
  const user = await prisma.user.findFirst({
    where: { id: userId, role: { in: [...accountRoles] } },
    select: { image: true },
  });
  if (!user?.image || !isProfileObjectKey(user.image, userId)) {
    return NextResponse.json({ error: "Foto pengguna belum tersedia." }, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const object = await getProfileImage(user.image);
    if (!object.Body) {
      return NextResponse.json({ error: "Foto pengguna tidak ditemukan." }, {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
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
      return NextResponse.json({ error: error.message }, {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
    console.error("User photo retrieval failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "Foto pengguna gagal dimuat." }, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
