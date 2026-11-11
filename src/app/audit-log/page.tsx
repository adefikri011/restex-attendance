import type { Metadata } from "next";
import { AuditLogPage } from "@/components/audit-log/audit-log-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/lib/auth-guard";
import { getAuditLogPageData } from "@/lib/audit-log-service";

export const metadata: Metadata = {
  title: "Audit Log | RESTEX Attendance",
  description: "Tinjau jejak perubahan penting dalam pengelolaan RESTEX Attendance.",
};

export const instant = false;

export default async function AuditLogRoute() {
  const user = await requirePageUser(["super-admin", "admin"]);
  const data = await getAuditLogPageData({
    range: "7 hari",
    category: "Semua",
    search: "",
    offset: 0,
  });

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <AuditLogPage initialData={data} />
    </DashboardShell>
  );
}
