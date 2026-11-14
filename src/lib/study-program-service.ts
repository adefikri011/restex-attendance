import "server-only";
import { prisma } from "@/lib/prisma";
import { getRecruitmentSettings } from "@/lib/recruitment-service";
import { getRecruitmentStatus } from "@/lib/recruitment";
import { normalizeStudyProgramName } from "@/lib/recruitment-application-schema";

export async function isRecruitmentOpen() {
  const settings = await getRecruitmentSettings();
  return getRecruitmentStatus(new Date(), settings).state === "open";
}

export async function getStudyPrograms(query: string) {
  const normalizedQuery = normalizeStudyProgramName(query).slice(0, 100);
  return prisma.studyProgram.findMany({
    where: normalizedQuery
      ? { normalizedName: { contains: normalizedQuery } }
      : undefined,
    orderBy: { name: "asc" },
    take: 20,
    select: { id: true, name: true },
  });
}

export async function saveStudyProgram(name: string) {
  const normalizedName = normalizeStudyProgramName(name);
  return prisma.studyProgram.upsert({
    where: { normalizedName },
    create: { name, normalizedName },
    update: {},
    select: { id: true, name: true },
  });
}
