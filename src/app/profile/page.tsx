import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProfilePage } from "@/components/profile/profile-page";
import { requirePageUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Profil Saya | RESTEX Attendance",
  description: "Kelola nama dan foto profil akun RESTEX Attendance.",
};

export const instant = false;

export default async function ProfileRoute() {
  const access = await requirePageUser();
  const user = await prisma.user.findUnique({
    where: { id: access.id },
    select: {
      name: true,
      email: true,
      image: true,
      updatedAt: true,
      member: { select: { id: true } },
    },
  });
  if (!user) {
    throw new Error("Data profil pengguna tidak ditemukan.");
  }

  return (
    <DashboardShell role={access.role} displayName={user.name}>
      <ProfilePage
        name={user.name}
        email={user.email}
        role={access.role}
        hasMemberRecord={Boolean(user.member)}
        imageUrl={user.image ? `/api/profile/photo?v=${user.updatedAt.getTime()}` : null}
      />
    </DashboardShell>
  );
}
