import type { Metadata } from "next";
import { AttendancePage } from "@/components/attendance/attendance-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/lib/auth-guard";
import { getAttendancePageData } from "@/lib/attendance-service";

export const metadata: Metadata = {
  title: "Absensi Pengurus | RESTEX Attendance",
  description: "Buka sesi dan rekap kehadiran pengurus RESTEX.",
};

export const instant = false;

export default async function OfficerAttendanceRoute() {
  const user = await requirePageUser(["super-admin", "admin"]);
  const data = await getAttendancePageData(user, "officers");

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <AttendancePage {...data} role={user.role} audience="officers" />
    </DashboardShell>
  );
}
