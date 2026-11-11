import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MembersPage } from "@/components/members/members-page";
import { requirePageUser } from "@/lib/auth-guard";
import { getMembersPageData } from "@/lib/member-service";
import { getDivisionsPageData } from "@/lib/division-service";

export const metadata: Metadata = {
  title: "Anggota | RESTEX Attendance",
  description: "Kelola dan pantau data anggota RESTEX.",
};

export const instant = false;

export default async function MembersRoute() {
  const user = await requirePageUser(["super-admin", "admin"]);
  const [{ members, periodName }, divisions] = await Promise.all([
    getMembersPageData(),
    getDivisionsPageData(),
  ]);

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <MembersPage
        initialDivisions={divisions}
        initialMembers={members}
        periodName={periodName}
        canManageDivisions={user.role === "super-admin"}
      />
    </DashboardShell>
  );
}
