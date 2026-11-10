import type { Metadata } from "next";
import { AttendancePage } from "@/components/attendance/attendance-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Monitoring Absensi | RESTEX Attendance",
  description: "Pantau sesi kegiatan dan rekap kehadiran anggota RESTEX.",
};

export const instant = false;

export default async function AttendanceRoute() {
  const user = await requirePageUser(["super-admin", "admin", "ketua-divisi"]);

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <AttendancePage />
    </DashboardShell>
  );
}
