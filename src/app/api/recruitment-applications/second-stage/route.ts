import { ApplicantStage, Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log-service";
import { getApiUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class SecondStageSubmissionError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  const access = await getApiUser(["calon-anggota"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Masuk ke portal calon anggota untuk mengirim formulir." },
      { status: access.status },
    );
  }
  if (Number(request.headers.get("content-length") ?? 0) > 16_384) {
    return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }
  if (
    !isRecord(body) ||
    typeof body.division !== "string" ||
    typeof body.divisionReason !== "string" ||
    (body.experience !== undefined && typeof body.experience !== "string")
  ) {
    return NextResponse.json({ error: "Lengkapi data formulir lanjutan." }, { status: 400 });
  }

  const division = body.division.trim();
  const divisionReason = body.divisionReason.trim();
  const experience = typeof body.experience === "string" ? body.experience.trim() : "";
  if (!division || division.length > 100) {
    return NextResponse.json({ error: "Pilih divisi yang tersedia." }, { status: 400 });
  }
  if (divisionReason.length < 20 || divisionReason.length > 1500) {
    return NextResponse.json(
      { error: "Alasan memilih divisi harus berisi 20 sampai 1500 karakter." },
      { status: 400 },
    );
  }
  if (experience.length > 2000) {
    return NextResponse.json(
      { error: "Pengalaman maksimal 2000 karakter." },
      { status: 400 },
    );
  }

  try {
    const application = await prisma.$transaction(async (transaction) => {
      const current = await transaction.recruitmentApplication.findUnique({
        where: { userId: access.user.id },
        select: {
          id: true,
          fullName: true,
          stage: true,
          decision: true,
        },
      });
      if (!current) {
        throw new SecondStageSubmissionError(
          "Data pendaftaran tidak ditemukan.",
          404,
        );
      }
      if (
        current.stage !== ApplicantStage.FORM_TWO_OPEN ||
        current.decision !== null
      ) {
        throw new SecondStageSubmissionError(
          "Formulir lanjutan belum dibuka atau sudah dikirim.",
          409,
        );
      }

      const activeDivision = await transaction.division.findFirst({
        where: { name: division, isActive: true },
        select: { name: true },
      });
      if (!activeDivision) {
        throw new SecondStageSubmissionError(
          "Divisi yang dipilih sudah tidak tersedia. Muat ulang halaman.",
          409,
        );
      }

      const updated = await transaction.recruitmentApplication.update({
        where: { id: current.id },
        data: {
          division: activeDivision.name,
          divisionReason,
          experience: experience || null,
          stage: ApplicantStage.FORM_TWO_SUBMITTED,
        },
        select: { id: true, stage: true },
      });
      await writeAuditLog(transaction, {
        actorId: access.user.id,
        action: "recruitment.applicant_form_submitted",
        entity: "recruitment",
        entityId: current.id,
        oldValue: { name: current.fullName, status: current.stage },
        newValue: {
          name: current.fullName,
          status: updated.stage,
          division: activeDivision.name,
        },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/portal/calon-anggota");
    revalidatePath("/recruitment/applicants");
    return NextResponse.json({ application });
  } catch (error) {
    if (error instanceof SecondStageSubmissionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Status pendaftaran berubah. Muat ulang lalu coba kembali." },
        { status: 409 },
      );
    }
    console.error("Candidate second-stage application submission failed.", error);
    return NextResponse.json(
      { error: "Formulir lanjutan gagal dikirim. Coba kembali." },
      { status: 500 },
    );
  }
}
