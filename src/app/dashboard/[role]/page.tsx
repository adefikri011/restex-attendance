import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appRoles, getAppRole } from "@/components/auth/role-config";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";
import { requirePageUser } from "@/lib/auth-guard";
import { getSuperAdminDashboardData } from "@/lib/dashboard-service";

type RoleDashboardRouteProps = {
  params: Promise<{ role: string }>;
};

export function generateStaticParams() {
  return appRoles
    .filter((role) => role.id !== "anggota")
    .map((role) => ({ role: role.id }));
}

export const instant = false;

export async function generateMetadata({
  params,
}: RoleDashboardRouteProps): Promise<Metadata> {
  const { role: roleId } = await params;
  const role = getAppRole(roleId);

  return {
    title: role ? `${role.label} | RESTEX Attendance` : "Dashboard | RESTEX Attendance",
    description: role?.description ?? "Ruang kerja RESTEX Attendance.",
  };
}

export default async function RoleDashboardRoute({
  params,
}: RoleDashboardRouteProps) {
  const { role: roleId } = await params;
  const role = getAppRole(roleId);

  if (!role || role.id === "anggota") notFound();
  const user = await requirePageUser([role.id]);
  const dashboardData =
    role.id === "super-admin" ? await getSuperAdminDashboardData() : undefined;

  return (
    <DashboardShell role={role.id} displayName={user.name}>
      <RoleDashboardPage
        roleId={role.id}
        displayName={user.name}
        dashboardData={dashboardData}
      />
    </DashboardShell>
  );
}
