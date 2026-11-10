import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AttendanceSessionLoading() {
  return (
    <DashboardShell>
      <p role="status" aria-busy="true">
        Memuat detail sesi...
      </p>
    </DashboardShell>
  );
}
