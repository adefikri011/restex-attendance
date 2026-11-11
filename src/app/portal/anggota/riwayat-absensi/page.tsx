import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MemberAttendanceHistoryPage } from "@/components/dashboard/member-portal-detail";
import { requirePageUser } from "@/lib/auth-guard";
import { getMemberAttendanceHistory } from "@/lib/member-portal-service";

export const metadata: Metadata = {
  title: "Riwayat Absensi | Portal Anggota",
  description: "Riwayat absensi pribadi pada periode aktif RESTEX.",
};

export const instant = false;

export default async function MemberAttendanceHistoryRoute() {
  const user = await requirePageUser(["anggota"]);
  const data = await getMemberAttendanceHistory(user.id);

  return (
    <DashboardShell role="anggota" displayName={user.name}>
      <MemberAttendanceHistoryPage data={data} />
    </DashboardShell>
  );
}
