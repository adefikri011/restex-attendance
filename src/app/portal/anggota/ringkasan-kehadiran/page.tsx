import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MemberAttendanceSummaryPage } from "@/components/dashboard/member-portal-detail";
import { requirePageUser } from "@/lib/auth-guard";
import { getMemberAttendanceSummary } from "@/lib/member-portal-service";

export const metadata: Metadata = {
  title: "Ringkasan Kehadiran | Portal Anggota",
  description: "Ringkasan kehadiran pribadi pada periode aktif RESTEX.",
};

export const instant = false;

export default async function MemberAttendanceSummaryRoute() {
  const user = await requirePageUser(["anggota"]);
  const data = await getMemberAttendanceSummary(user.id);

  return (
    <DashboardShell role="anggota" displayName={user.name}>
      <MemberAttendanceSummaryPage data={data} />
    </DashboardShell>
  );
}
