import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LanyardCardPage } from "@/components/lanyard/lanyard-card-page";

export const metadata: Metadata = {
  title: "Kartu Lanyard | RESTEX Attendance",
  description: "Buat dan pratinjau kartu identitas anggota RESTEX.",
};

export default function LanyardCardRoute() {
  return (
    <DashboardShell>
      <LanyardCardPage />
    </DashboardShell>
  );
}
