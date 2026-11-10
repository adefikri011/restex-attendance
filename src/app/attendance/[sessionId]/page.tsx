import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AttendanceSessionDetail } from "@/components/attendance/attendance-session-detail";
import { createInitialSessions } from "@/components/attendance/attendance-data";
import { initialMembers } from "@/components/members/member-data";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Detail Sesi | RESTEX Attendance",
  description: "Pantau rekap dan kehadiran anggota pada sesi RESTEX.",
};

const sessions = createInitialSessions(initialMembers);

export function generateStaticParams() {
  return sessions.map(({ id }) => ({ sessionId: id }));
}

export default function AttendanceSessionRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  return (
    <DashboardShell>
      <Suspense fallback={<p role="status" aria-busy="true">Memuat detail sesi...</p>}>
        <AttendanceSessionContent params={params} />
      </Suspense>
    </DashboardShell>
  );
}

async function AttendanceSessionContent({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = sessions.find((item) => item.id === sessionId);

  if (!session) notFound();

  return <AttendanceSessionDetail session={session} members={initialMembers} />;
}
