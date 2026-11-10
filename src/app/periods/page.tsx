import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PeriodsPage } from "@/components/periods/periods-page";

export const metadata: Metadata = {
  title: "Periode | RESTEX Attendance",
  description: "Kelola periode kepengurusan aktif, arsip, dan rencana periode RESTEX.",
};

export default function PeriodsRoute() {
  return (
    <DashboardShell>
      <PeriodsPage />
    </DashboardShell>
  );
}
