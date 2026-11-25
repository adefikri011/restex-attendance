import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RecruitmentMeetingsPage } from "@/components/recruitment/recruitment-meetings-page";
import { requirePageUser } from "@/lib/auth-guard";
import { getRecruitmentMeetingOverview } from "@/lib/recruitment-meeting-service";

export const metadata: Metadata = {
  title: "Jadwal Pertemuan | RESTEX Attendance",
  description: "Atur sesi pertemuan seleksi calon anggota RESTEX.",
};

export const instant = false;

export default async function RecruitmentMeetingsRoute() {
  const user = await requirePageUser(undefined, "recruitment-meetings");
  const overview = await getRecruitmentMeetingOverview();

  return (
    <DashboardShell role={user.role} displayName={user.name} accessiblePages={user.accessiblePages}>
      <RecruitmentMeetingsPage initialOverview={overview} />
    </DashboardShell>
  );
}
