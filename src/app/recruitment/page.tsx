import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RecruitmentSettingsPage } from "@/components/recruitment/recruitment-settings-page";
import { requirePageUser } from "@/lib/auth-guard";
import { getRecruitmentSettings } from "@/lib/recruitment-service";

export const metadata: Metadata = {
  title: "Pendaftaran | RESTEX Attendance",
  description: "Atur status dan tautan pendaftaran anggota RESTEX.",
};

export const instant = false;

export default async function RecruitmentSettingsRoute() {
  const user = await requirePageUser(["super-admin", "admin"]);
  const settings = await getRecruitmentSettings();

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <RecruitmentSettingsPage initialSettings={settings} />
    </DashboardShell>
  );
}
