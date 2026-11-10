import type { Metadata } from "next";
import { AdministratorAccountsPage } from "@/components/administrator-accounts/administrator-accounts-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const metadata: Metadata = {
  title: "Akun Pengurus | RESTEX Attendance",
  description: "Kelola akun pengurus dan tanggung jawab Ketua Divisi RESTEX.",
};

export default function AdministratorAccountsRoute() {
  return (
    <DashboardShell>
      <AdministratorAccountsPage />
    </DashboardShell>
  );
}
