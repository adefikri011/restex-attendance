import { ApplicantDecision, ApplicantStage, Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log-service";
import { getApiUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request) {
  const access = await getApiUser(undefined, "recruitment-applicants");
  if (!access.user) {
    return NextResponse.json({ error: "Hanya Admin dan Super Admin yang dapat mengumumkan hasil." }, { status: access.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  if (
    !isRecord(body) ||
    !Array.isArray(body.applicationIds) ||
    body.applicationIds.length < 1 ||
    body.applicationIds.length > 100 ||
    !body.applicationIds.every((id) => typeof id === "string" && isUuid(id)) ||
    typeof body.decision !== "string" ||
    !Object.values(ApplicantDecision).includes(body.decision as ApplicantDecision)
  ) {
    return NextResponse.json({ error: "Pilih pendaftar dan hasil yang valid." }, { status: 400 });
  }

  const ids = [...new Set(body.applicationIds as string[])];
  if (ids.length !== body.applicationIds.length) {
    return NextResponse.json({ error: "Daftar pendaftar berisi pilihan duplikat." }, { status: 400 });
  }
  const decision = body.decision as ApplicantDecision;

  try {
    const announcedCount = await prisma.$transaction(async (transaction) => {
      const applications = await transaction.recruitmentApplication.findMany({
        where: { id: { in: ids } },
        select: { id: true, fullName: true, stage: true, decision: true },
      });
      if (applications.length !== ids.length) {
        throw new Error("Sebagian pendaftar tidak ditemukan.");
      }
      const ineligible = applications.filter(
        ({ stage, decision: currentDecision }) =>
          currentDecision !== null ||
          (stage !== ApplicantStage.FORM_TWO_SUBMITTED && stage !== ApplicantStage.FINAL_REVIEW),
      );
      if (ineligible.length) {
        throw new Error("Hanya pendaftar yang sudah mengirim formulir lanjutan yang dapat diumumkan.");
      }

      const update = await transaction.recruitmentApplication.updateMany({
        where: {
          id: { in: ids },
          decision: null,
          stage: { in: [ApplicantStage.FORM_TWO_SUBMITTED, ApplicantStage.FINAL_REVIEW] },
        },
        data: { stage: ApplicantStage.FINAL_REVIEW, decision },
      });
      if (update.count !== ids.length) {
        throw new Error("Status pendaftar berubah. Muat ulang daftar dan coba kembali.");
      }
      for (const application of applications) {
        await writeAuditLog(transaction, {
          actorId: access.user.id,
          action: "recruitment.applicant_updated",
          entity: "recruitment",
          entityId: application.id,
          oldValue: { name: application.fullName, status: application.stage },
          newValue: { name: application.fullName, status: decision },
        });
      }
      return update.count;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/recruitment/applicants");
    revalidatePath("/portal/calon-anggota");
    return NextResponse.json({ announcedCount });
  } catch (error) {
    console.error("Bulk recruitment result announcement failed.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pengumuman hasil gagal disimpan." },
      { status: 409 },
    );
  }
}
