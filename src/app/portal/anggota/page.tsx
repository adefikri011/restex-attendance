import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";
import { requirePageUser } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Portal Anggota | RESTEX Attendance",
  description: "Portal anggota RESTEX untuk profil dan riwayat absensi pribadi.",
};

export const instant = false;

export default async function MemberPortalRoute() {
  const user = await requirePageUser(["anggota"]);

  return (
    <DashboardShell role="anggota" displayName={user.name}>
      <RoleDashboardPage roleId="anggota" displayName={user.name} />
    </DashboardShell>
  );
}
