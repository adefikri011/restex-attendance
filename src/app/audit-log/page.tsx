import type { Metadata } from "next";
import { AuditLogPage } from "@/components/audit-log/audit-log-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Audit Log | RESTEX Attendance",
  description: "Tinjau jejak perubahan penting dalam pengelolaan RESTEX Attendance.",
};

export default function AuditLogRoute() {
  return (
    <DashboardShell>
      <AuditLogPage />
    </DashboardShell>
  );
}
