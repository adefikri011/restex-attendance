import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PeriodsPage } from "@/components/periods/periods-page";
import { requirePageUser } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Periode | RESTEX Attendance",
  description: "Kelola periode kepengurusan aktif, arsip, dan rencana periode RESTEX.",
};

export const instant = false;

export default async function PeriodsRoute() {
  const user = await requirePageUser(["super-admin", "admin"]);

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <PeriodsPage />
    </DashboardShell>
  );
}
