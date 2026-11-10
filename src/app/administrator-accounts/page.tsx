import type { Metadata } from "next";
import { AdministratorAccountsPage } from "@/components/administrator-accounts/administrator-accounts-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/lib/auth-guard";
import { getAdministratorAccountsPageData } from "@/lib/administrator-account-service";

export const metadata: Metadata = {
  title: "Akun Pengurus | RESTEX Attendance",
  description: "Kelola akun pengurus dan tanggung jawab Ketua Divisi RESTEX.",
};

export const instant = false;

export default async function AdministratorAccountsRoute() {
  const user = await requirePageUser(["super-admin"]);
  const accountData = await getAdministratorAccountsPageData();

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <AdministratorAccountsPage {...accountData} />
    </DashboardShell>
  );
}
