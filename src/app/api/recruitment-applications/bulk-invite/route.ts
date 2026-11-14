import { ApplicantStage, Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit-log-service";
import { getApiUser } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

class BulkInviteError extends Error {
  constructor(
    message: string,
    readonly status = 409,
  ) {
    super(message);
  }
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Admin dan Super Admin yang dapat mengundang pendaftar." },
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
    !Array.isArray(body.applicationIds) ||
    body.applicationIds.length < 1 ||
    body.applicationIds.length > 100 ||
    !body.applicationIds.every((id) => typeof id === "string" && isUuid(id))
  ) {
    return NextResponse.json(
      { error: "Pilih antara 1 sampai 100 pendaftar yang valid." },
      { status: 400 },
    );
  }

  const ids = [...new Set(body.applicationIds as string[])];
  if (ids.length !== body.applicationIds.length) {
    return NextResponse.json(
      { error: "Daftar pendaftar berisi pilihan duplikat." },
      { status: 400 },
    );
  }

  try {
    const invitedCount = await prisma.$transaction(async (transaction) => {
      const applications = await transaction.recruitmentApplication.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          fullName: true,
          stage: true,
          decision: true,
        },
      });
      if (applications.length !== ids.length) {
        throw new BulkInviteError("Sebagian pendaftar tidak ditemukan.", 404);
      }

      const ineligible = applications.filter(
        ({ stage, decision }) =>
          decision !== null ||
          (stage !== ApplicantStage.SUBMITTED && stage !== ApplicantStage.SCREENING),
      );
      if (ineligible.length) {
        throw new BulkInviteError(
          `${ineligible.length} pendaftar tidak lagi berada pada tahap screening.`,
        );
      }

      const update = await transaction.recruitmentApplication.updateMany({
        where: {
          id: { in: ids },
          decision: null,
          stage: { in: [ApplicantStage.SUBMITTED, ApplicantStage.SCREENING] },
        },
        data: {
          stage: ApplicantStage.MEETING_INVITED,
          meetingMode: null,
          meetingSessionId: null,
          meetingAttendance: null,
          meetingNotes: null,
        },
      });
      if (update.count !== ids.length) {
        throw new BulkInviteError(
          "Status pendaftar berubah. Muat ulang daftar dan coba kembali.",
        );
      }

      for (const application of applications) {
        await writeAuditLog(transaction, {
          actorId: access.user.id,
          action: "recruitment.applicant_updated",
          entity: "recruitment",
          entityId: application.id,
          oldValue: {
            name: application.fullName,
            status: application.stage,
          },
          newValue: {
            name: application.fullName,
            status: ApplicantStage.MEETING_INVITED,
          },
        });
      }
      return update.count;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/recruitment/applicants");
    revalidatePath("/portal/calon-anggota");
    return NextResponse.json({ invitedCount });
  } catch (error) {
    if (error instanceof BulkInviteError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "Status pendaftar baru saja berubah. Muat ulang lalu coba kembali." },
        { status: 409 },
      );
    }
    console.error("Bulk recruitment invitation failed.", error);
    return NextResponse.json(
      { error: "Undangan massal gagal disimpan." },
      { status: 500 },
    );
  }
}
