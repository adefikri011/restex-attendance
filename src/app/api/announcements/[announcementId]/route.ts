import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { updateAnnouncementPublication } from "@/lib/announcement-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ announcementId: string }> },
) {
  const access = await getApiUser(undefined, "announcements");
  if (!access.user) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: access.status });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("isPublished" in body) || typeof body.isPublished !== "boolean") {
    return NextResponse.json({ error: "Status publikasi tidak valid." }, { status: 400 });
  }

  try {
    const { announcementId } = await params;
    const announcement = await updateAnnouncementPublication(announcementId, body.isPublished);
    revalidatePath("/announcements");
    revalidatePath(`/announcements/${announcement.slug}`);
    revalidatePath("/announcements/manage");
    revalidatePath("/");
    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Announcement publication update failed.", error);
    return NextResponse.json({ error: "Status pengumuman gagal diperbarui." }, { status: 500 });
  }
}
