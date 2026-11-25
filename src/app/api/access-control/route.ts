import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  getPageAccessSettings,
  parsePageAccessChanges,
  savePageAccessSettings,
} from "@/lib/page-access-service";

export async function GET() {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mengatur akses halaman." },
      { status: access.status },
    );
  }
  return NextResponse.json(await getPageAccessSettings());
}

export async function PUT(request: Request) {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mengatur akses halaman." },
      { status: access.status },
    );
  }
  if (Number(request.headers.get("content-length") ?? 0) > 65_536) {
    return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  const changes =
    typeof body === "object" && body !== null && "changes" in body
      ? parsePageAccessChanges(body.changes)
      : null;
  if (!changes) {
    return NextResponse.json({ error: "Perubahan akses tidak valid." }, { status: 400 });
  }

  try {
    await savePageAccessSettings(changes, access.user.id);
    return NextResponse.json(await getPageAccessSettings());
  } catch (error) {
    console.error("Page access settings update failed.", error);
    return NextResponse.json(
      { error: "Pengaturan akses gagal disimpan." },
      { status: 500 },
    );
  }
}
