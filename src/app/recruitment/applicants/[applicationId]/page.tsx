import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RecruitmentApplicantDetailPage } from "@/components/recruitment/recruitment-applicant-detail-page";
import { requirePageUser } from "@/lib/auth-guard";
import { getRecruitmentApplicantDetail } from "@/lib/recruitment-applicant-service";

export const metadata: Metadata = {
  title: "Detail Pendaftar | RESTEX Attendance",
  description: "Tinjau data pendaftaran calon anggota RESTEX.",
};

export const instant = false;

export default async function RecruitmentApplicantDetailRoute({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const user = await requirePageUser(["super-admin", "admin"]);
  const { applicationId } = await params;
  const application = await getRecruitmentApplicantDetail(applicationId);

  if (!application) notFound();

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <RecruitmentApplicantDetailPage application={application} />
    </DashboardShell>
  );
}
