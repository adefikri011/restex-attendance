import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MembersPage } from "@/components/members/members-page";

export const metadata: Metadata = {
  title: "Anggota | RESTEX Attendance",
  description: "Kelola dan pantau data anggota RESTEX.",
};

export default function MembersRoute() {
  return (
    <DashboardShell>
      <MembersPage />
    </DashboardShell>
  );
}
