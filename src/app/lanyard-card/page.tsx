import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LanyardCardPage } from "@/components/lanyard/lanyard-card-page";
import { requirePageUser } from "@/lib/auth-guard";
import { getMembersPageData } from "@/lib/member-service";

export const metadata: Metadata = {
  title: "Kartu Lanyard | RESTEX Attendance",
  description: "Buat dan pratinjau kartu identitas anggota RESTEX.",
};

export const instant = false;

export default async function LanyardCardRoute() {
  const user = await requirePageUser(["super-admin", "admin", "ketua-divisi"]);
  const { members, periodName } = await getMembersPageData();

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <LanyardCardPage members={members} periodName={periodName} />
    </DashboardShell>
  );
}
