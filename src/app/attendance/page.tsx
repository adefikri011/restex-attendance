import type { Metadata } from "next";
import { AttendancePage } from "@/components/attendance/attendance-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/lib/auth-guard";
import { getAttendancePageData } from "@/lib/attendance-service";

export const metadata: Metadata = {
  title: "Monitoring Absensi | RESTEX Attendance",
  description: "Pantau sesi kegiatan dan rekap kehadiran anggota RESTEX.",
};

export const instant = false;

export default async function AttendanceRoute() {
  const user = await requirePageUser(undefined, "attendance");
  const data = await getAttendancePageData(user);

  return (
    <DashboardShell role={user.role} displayName={user.name} accessiblePages={user.accessiblePages}>
      <AttendancePage {...data} role={user.role} />
    </DashboardShell>
  );
}
