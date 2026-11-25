import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AnnouncementManagementPage } from "@/components/announcements/announcement-management-page";
import { requirePageUser } from "@/lib/auth-guard";
import { getAllAnnouncements } from "@/lib/announcement-service";

export const metadata: Metadata = {
  title: "Kelola Pengumuman | RESTEX Attendance",
};

export default async function AnnouncementManagementRoute() {
  const user = await requirePageUser(undefined, "announcements");
  const announcements = await getAllAnnouncements();
  return (
    <DashboardShell role={user.role} displayName={user.name} accessiblePages={user.accessiblePages}>
      <AnnouncementManagementPage initialAnnouncements={announcements} />
    </DashboardShell>
  );
}
