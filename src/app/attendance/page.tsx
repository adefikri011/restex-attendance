import type { Metadata } from "next";
import { AttendancePage } from "@/components/attendance/attendance-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Sesi Absensi | RESTEX Attendance",
  description: "Kelola sesi kegiatan dan pantau kehadiran anggota RESTEX.",
};

export default function AttendanceRoute() {
  return (
    <DashboardShell>
      <AttendancePage />
    </DashboardShell>
  );
}
