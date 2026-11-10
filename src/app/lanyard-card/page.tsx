import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LanyardCardPage } from "@/components/lanyard/lanyard-card-page";
import { requirePageUser } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Kartu Lanyard | RESTEX Attendance",
  description: "Buat dan pratinjau kartu identitas anggota RESTEX.",
};

export const instant = false;

export default async function LanyardCardRoute() {
  const user = await requirePageUser(["super-admin", "admin", "ketua-divisi"]);

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <LanyardCardPage />
    </DashboardShell>
  );
}
