import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePageUser } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Dashboard | RESTEX Attendance",
  description: "Dashboard administrasi kehadiran anggota RESTEX.",
};

export const instant = false;

export default async function DashboardRoute() {
  const user = await requirePageUser();
  redirect(user.role === "anggota" ? "/portal/anggota" : `/dashboard/${user.role}`);
}
