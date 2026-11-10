import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ReportsPage } from "@/components/reports/reports-page";
import { requirePageUser } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Laporan | RESTEX Attendance",
  description: "Tinjau dan ekspor laporan kehadiran anggota RESTEX.",
};

export const instant = false;

export default async function ReportsRoute() {
  const user = await requirePageUser(["super-admin", "admin", "ketua-divisi"]);

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <ReportsPage />
    </DashboardShell>
  );
}
