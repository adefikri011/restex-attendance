import "server-only";
import type {
  ApplicantScreeningRating,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const pageSize = 20;

export type ApplicantRatingFilter = ApplicantScreeningRating | "UNRATED" | "ALL";

export async function getRecruitmentApplicants(
  page: number,
  query = "",
  rating: ApplicantRatingFilter = "ALL",
) {
  const search = query.trim().slice(0, 100);
  const where: Prisma.RecruitmentApplicationWhereInput = {
    ...(search
      ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { nim: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
      : {}),
    ...(rating === "UNRATED"
      ? { screeningRating: null }
      : rating !== "ALL"
        ? { screeningRating: rating }
        : {}),
  };

  const result = await prisma.$transaction(async (transaction) => {
    const total = await transaction.recruitmentApplication.count({ where });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const applications = await transaction.recruitmentApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        fullName: true,
        nim: true,
        email: true,
        studyProgram: { select: { name: true } },
        cohort: true,
        stage: true,
        decision: true,
        screeningRating: true,
        createdAt: true,
      },
    });

    return { applications, page: currentPage, pageSize, total, totalPages };
  });

  return result;
}

export async function getRecruitmentApplicantDetail(id: string) {
  return prisma.recruitmentApplication.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      nim: true,
      email: true,
      studyProgram: { select: { name: true } },
      cohort: true,
      motivation: true,
      stage: true,
      decision: true,
      screeningRating: true,
      division: true,
      divisionReason: true,
      experience: true,
      meetingMode: true,
      meetingAttendance: true,
      meetingNotes: true,
      meetingSession: {
        select: {
          title: true,
          startsAt: true,
          endsAt: true,
          location: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });
}
