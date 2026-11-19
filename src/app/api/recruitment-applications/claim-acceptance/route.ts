import { ApplicantDecision } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { promoteAcceptedApplicant } from "@/lib/recruitment-membership-service";

export async function POST() {
  const access = await getApiUser(["calon-anggota"]);
  if (!access.user) {
    return NextResponse.json({ error: "Akses portal calon anggota ditolak." }, { status: access.status });
  }

  try {
    const memberCode = await prisma.$transaction(async (transaction) => {
      const application = await transaction.recruitmentApplication.findUnique({
        where: { userId: access.user.id },
        select: { id: true, decision: true },
      });
      if (!application || application.decision !== ApplicantDecision.ACCEPTED) {
        throw new Error("Pengumuman diterima belum tersedia.");
      }
      return promoteAcceptedApplicant(transaction, application.id, access.user.id);
    });
    revalidatePath("/portal/calon-anggota");
    revalidatePath("/portal/anggota");
    revalidatePath("/members");
    return NextResponse.json({ memberCode });
  } catch (error) {
    console.error("Accepted applicant promotion failed.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Akun anggota gagal disiapkan." },
      { status: 409 },
    );
  }
}
