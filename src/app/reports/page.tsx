import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ReportsPage } from "@/components/reports/reports-page";
import type { ReportRange } from "@/components/reports/report-data";
import { requirePageUser } from "@/lib/auth-guard";
import { getReportsPageData } from "@/lib/report-service";

export const metadata: Metadata = {
  title: "Laporan | RESTEX Attendance",
  description: "Tinjau dan ekspor laporan kehadiran anggota RESTEX.",
};

export const instant = false;

export default async function ReportsRoute() {
  const user = await requirePageUser(["super-admin", "admin", "ketua-divisi"]);
  const initialData = await getReportsPageData(
    user,
    undefined,
    "Bulan ini" satisfies ReportRange,
  );

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <ReportsPage initialData={initialData} />
    </DashboardShell>
  );
}
