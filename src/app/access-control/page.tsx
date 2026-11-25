import type { Metadata } from "next";
import { AccessControlPage } from "@/components/access-control/access-control-page";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageUser } from "@/lib/auth-guard";
import {
  getOfficerAssignmentData,
  getPageAccessSettings,
} from "@/lib/page-access-service";

export const metadata: Metadata = {
  title: "Akses Halaman | RESTEX Attendance",
  description: "Atur akses halaman berdasarkan role dan jabatan.",
};

export const instant = false;

export default async function AccessControlRoute() {
  const user = await requirePageUser(["super-admin"]);
  const [settings, assignments] = await Promise.all([
    getPageAccessSettings(),
    getOfficerAssignmentData(),
  ]);

  return (
    <DashboardShell role={user.role} displayName={user.name} accessiblePages={user.accessiblePages}>
      <AccessControlPage
        initialSettings={settings}
        initialAssignmentData={assignments}
      />
    </DashboardShell>
  );
}
