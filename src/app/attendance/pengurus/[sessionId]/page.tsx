import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AttendanceSessionDetail } from "@/components/attendance/attendance-session-detail";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/lib/auth-guard";
import { getAttendanceSessionData } from "@/lib/attendance-service";

export const metadata: Metadata = {
  title: "Detail Absensi Pengurus | RESTEX Attendance",
  description: "Scan QR dan lihat rekap kehadiran pengurus RESTEX.",
};

export const instant = false;

export default async function OfficerAttendanceSessionRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requirePageUser(undefined, "officer-attendance");
  const { sessionId } = await params;
  const data = await getAttendanceSessionData(sessionId, user, "officers");
  if (!data) notFound();

  return (
    <DashboardShell role={user.role} displayName={user.name} accessiblePages={user.accessiblePages}>
      <AttendanceSessionDetail {...data} audience="officers" />
    </DashboardShell>
  );
}
