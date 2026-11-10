import type { Metadata } from "next";
import { AttendancePage } from "@/components/attendance/attendance-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Monitoring Absensi | RESTEX Attendance",
  description: "Pantau sesi kegiatan dan rekap kehadiran anggota RESTEX.",
};

export default function AttendanceRoute() {
  return (
    <DashboardShell>
      <AttendancePage />
    </DashboardShell>
  );
}
