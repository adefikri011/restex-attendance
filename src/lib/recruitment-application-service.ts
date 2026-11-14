import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { Prisma } from "@/generated/prisma/client";
import { getRecruitmentStatus, RECRUITMENT } from "@/lib/recruitment";
import {
  normalizeStudyProgramName,
  recruitmentApplicationFieldsSchema,
  type NewRecruitmentApplication,
} from "@/lib/recruitment-application-schema";
import { prisma } from "@/lib/prisma";

export class RecruitmentApplicationError extends Error {}

export function validateRecruitmentApplication(
  value: unknown,
): NewRecruitmentApplication {
  const result = recruitmentApplicationFieldsSchema.safeParse(value);
  if (!result.success) {
    throw new RecruitmentApplicationError(
      result.error.issues[0]?.message ?? "Data pendaftaran tidak valid.",
    );
  }
  return result.data;
}

export async function createRecruitmentApplication(
  input: NewRecruitmentApplication,
) {
  const passwordHash = await hashPassword(input.password);

  return prisma.$transaction(
    async (transaction) => {
      const recruitmentSetting =
        await transaction.recruitmentSetting.findUnique({
          where: { id: "global" },
          select: {
            open: true,
            opensAt: true,
            closesAt: true,
            registerUrl: true,
            notifyUrl: true,
          },
        });
      const settings = recruitmentSetting
        ? {
            open: recruitmentSetting.open,
            opensAt: recruitmentSetting.opensAt?.toISOString().slice(0, 10),
            closesAt: recruitmentSetting.closesAt?.toISOString().slice(0, 10),
            registerUrl: recruitmentSetting.registerUrl,
            notifyUrl: recruitmentSetting.notifyUrl,
          }
        : RECRUITMENT;
      if (getRecruitmentStatus(new Date(), settings).state !== "open") {
        throw new RecruitmentApplicationError(
          "Pendaftaran sedang tidak dibuka.",
        );
      }

      const userId = randomUUID();
      const applicationId = randomUUID();
      const normalizedProgramName = normalizeStudyProgramName(input.program);
      const studyProgram = await transaction.studyProgram.upsert({
        where: { normalizedName: normalizedProgramName },
        create: {
          name: input.program,
          normalizedName: normalizedProgramName,
        },
        update: {},
        select: { id: true },
      });

      await transaction.user.create({
        data: {
          id: userId,
          name: input.name,
          email: input.email,
          emailVerified: false,
          role: "CANDIDATE",
          isActive: true,
          accounts: {
            create: {
              id: randomUUID(),
              accountId: userId,
              providerId: "credential",
              password: passwordHash,
            },
          },
        },
      });

      await transaction.recruitmentApplication.create({
        data: {
          id: applicationId,
          userId,
          fullName: input.name,
          nim: input.nim,
          email: input.email,
          studyProgramId: studyProgram.id,
          cohort: input.cohort,
          motivation: input.motivation,
        },
      });

      return { id: applicationId };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
