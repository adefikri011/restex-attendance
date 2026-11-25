import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LanyardCardPage } from "@/components/lanyard/lanyard-card-page";
import { requirePageUser } from "@/lib/auth-guard";
import { getMembersPageData } from "@/lib/member-service";
import { ensureOfficerMemberIdentityForUser } from "@/lib/administrator-account-service";

export const metadata: Metadata = {
  title: "Kartu Lanyard | RESTEX Attendance",
  description: "Buat dan pratinjau kartu identitas anggota RESTEX.",
};

export const instant = false;

export default async function LanyardCardRoute() {
  const user = await requirePageUser(undefined, "lanyard-card");
  const division =
    user.role === "ketua-divisi" || user.role === "pj-divisi"
      ? user.managedDivision
      : undefined;
  await ensureOfficerMemberIdentityForUser(user.id);
  const { members, periodName } = await getMembersPageData(division);

  return (
    <DashboardShell role={user.role} displayName={user.name} accessiblePages={user.accessiblePages}>
      <LanyardCardPage
        members={members}
        periodName={periodName}
      />
    </DashboardShell>
  );
}
