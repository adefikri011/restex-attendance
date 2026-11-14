import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RecruitmentApplicantsPage } from "@/components/recruitment/recruitment-applicants-page";
import { requirePageUser } from "@/lib/auth-guard";
import { getRecruitmentApplicants } from "@/lib/recruitment-applicant-service";
import { ApplicantScreeningRating } from "@/generated/prisma/client";
import type { ApplicantRatingFilter } from "@/lib/recruitment-applicant-service";

function isRatingFilter(value: string): value is ApplicantRatingFilter {
  return (
    value === "ALL" ||
    value === "UNRATED" ||
    Object.values(ApplicantScreeningRating).some((rating) => rating === value)
  );
}

export const metadata: Metadata = {
  title: "Pendaftar | RESTEX Attendance",
  description: "Tinjau data pendaftar rekrutmen anggota RESTEX.",
};

export const instant = false;

export default async function RecruitmentApplicantsRoute({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; rating?: string }>;
}) {
  const user = await requirePageUser(["super-admin", "admin"]);
  const params = await searchParams;
  const parsedPage = Number(params.page ?? "1");
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 && parsedPage <= 100_000
      ? parsedPage
      : 1;
  const requestedRating = params.rating ?? "ALL";
  const rating: ApplicantRatingFilter = isRatingFilter(requestedRating)
    ? requestedRating
    : "ALL";
  const results = await getRecruitmentApplicants(page, params.q ?? "", rating);

  return (
    <DashboardShell role={user.role} displayName={user.name}>
      <RecruitmentApplicantsPage
        applications={results.applications}
        page={results.page}
        total={results.total}
        totalPages={results.totalPages}
        query={params.q ?? ""}
        rating={rating}
      />
    </DashboardShell>
  );
}
