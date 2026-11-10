import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ReportsPage } from "@/components/reports/reports-page";

export const metadata: Metadata = {
  title: "Laporan | RESTEX Attendance",
  description: "Tinjau dan ekspor laporan kehadiran anggota RESTEX.",
};

export default function ReportsRoute() {
  return (
    <DashboardShell>
      <ReportsPage />
    </DashboardShell>
  );
}
