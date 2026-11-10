import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AttendanceSessionDetail } from "@/components/attendance/attendance-session-detail";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/lib/auth-guard";
import { getAttendanceSessionData } from "@/lib/attendance-service";

export const metadata: Metadata = {
  title: "Detail Sesi | RESTEX Attendance",
  description: "Pantau rekap dan kehadiran anggota pada sesi RESTEX.",
};

export const instant = false;

export default async function AttendanceSessionRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await requirePageUser(["super-admin", "admin", "ketua-divisi", "pj-divisi"]);
  const { sessionId } = await params;
  const data = await getAttendanceSessionData(sessionId, user);
  if (!data) notFound();

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <AttendanceSessionDetail {...data} />
    </DashboardShell>
  );
}
