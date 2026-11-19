import { AnnouncementType } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAnnouncement, getPublishedAnnouncements } from "@/lib/announcement-service";
import { getApiUser } from "@/lib/auth-guard";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  return NextResponse.json({ announcements: await getPublishedAnnouncements() });
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json({ error: "Hanya Admin dan Super Admin yang dapat membuat pengumuman." }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  if (!isRecord(body)) {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const excerpt = typeof body.excerpt === "string" ? body.excerpt.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const type = body.type;
  const isPublished = body.isPublished === true;
  if (!title || title.length > 180 || !excerpt || excerpt.length > 320 || !content || content.length > 20_000) {
    return NextResponse.json({ error: "Judul, ringkasan, dan isi pengumuman wajib diisi." }, { status: 400 });
  }
  if (!Object.values(AnnouncementType).includes(type as AnnouncementType)) {
    return NextResponse.json({ error: "Jenis pengumuman tidak valid." }, { status: 400 });
  }

  try {
    const announcement = await createAnnouncement({
      title,
      excerpt,
      content,
      type: type as AnnouncementType,
      isPublished,
    });
    revalidatePath("/announcements");
    revalidatePath("/");
    revalidatePath("/announcements/manage");
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Announcement creation failed.", error);
    return NextResponse.json({ error: "Pengumuman gagal disimpan." }, { status: 500 });
  }
}
