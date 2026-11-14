import { NextResponse } from "next/server";
import { ApplicantScreeningRating } from "@/generated/prisma/client";
import type { ApplicantRatingFilter } from "@/lib/recruitment-applicant-service";
import {
  createRecruitmentApplication,
  RecruitmentApplicationError,
  validateRecruitmentApplication,
} from "@/lib/recruitment-application-service";
import { getApiUser } from "@/lib/auth-guard";
import { getRecruitmentApplicants } from "@/lib/recruitment-applicant-service";
import {
  TurnstileVerificationError,
  verifyTurnstileToken,
} from "@/lib/turnstile-verification";

function isRatingFilter(value: string): value is ApplicantRatingFilter {
  return (
    value === "ALL" ||
    value === "UNRATED" ||
    Object.values(ApplicantScreeningRating).some((rating) => rating === value)
  );
}

export async function GET(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Admin dan Super Admin yang dapat melihat data pendaftar." },
      { status: access.status },
    );
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || page > 100_000) {
    return NextResponse.json({ error: "Nomor halaman tidak valid." }, { status: 400 });
  }
  const ratingParam = url.searchParams.get("rating") ?? "ALL";
  if (!isRatingFilter(ratingParam)) {
    return NextResponse.json({ error: "Filter penilaian tidak valid." }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await getRecruitmentApplicants(
        page,
        url.searchParams.get("q") ?? "",
        ratingParam,
      ),
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Recruitment applicants lookup failed.", error);
    return NextResponse.json(
      { error: "Data pendaftar gagal dimuat. Silakan coba kembali." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 16_384) {
    return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Format data pendaftaran tidak valid." },
      { status: 400 },
    );
  }

  const record = body as Record<string, unknown>;
  try {
    await verifyTurnstileToken(
      record.captchaToken,
      "registration",
      new URL(request.url).hostname,
    );
    const input = validateRecruitmentApplication(record);
    await createRecruitmentApplication(input);
    return NextResponse.json({ submitted: true }, { status: 201 });
  } catch (error) {
    if (error instanceof RecruitmentApplicationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof TurnstileVerificationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "NIM atau email ini sudah pernah digunakan untuk mendaftar." },
        { status: 409 },
      );
    }
    if (error instanceof TurnstileVerificationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Recruitment application creation failed.", error);
    return NextResponse.json(
      { error: "Pendaftaran gagal disimpan. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
