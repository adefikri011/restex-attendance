import { NextResponse } from "next/server";
import { studyProgramNameSchema } from "@/lib/recruitment-application-schema";
import {
  getStudyPrograms,
  isRecruitmentOpen,
  saveStudyProgram,
} from "@/lib/study-program-service";
import {
  isStudyProgramTableMissing,
  studyProgramMigrationMessage,
} from "@/lib/study-program-errors";
import {
  TurnstileVerificationError,
  verifyTurnstileToken,
} from "@/lib/turnstile-verification";

export async function GET(request: Request) {
  try {
    if (!(await isRecruitmentOpen())) {
      return NextResponse.json(
        { programs: [] },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const query = new URL(request.url).searchParams.get("q") ?? "";
    const programs = await getStudyPrograms(query);
    return NextResponse.json(
      { programs },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (isStudyProgramTableMissing(error)) {
      return NextResponse.json(
        { error: studyProgramMigrationMessage },
        { status: 503 },
      );
    }
    console.error("Study program lookup failed.", error);
    return NextResponse.json(
      { error: "Daftar jurusan atau program studi gagal dimuat." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 4_096) {
    return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("name" in body)
  ) {
    return NextResponse.json(
      { error: "Nama jurusan atau program studi wajib diisi." },
      { status: 400 },
    );
  }

  const parsedName = studyProgramNameSchema.safeParse(body.name);
  if (!parsedName.success) {
    return NextResponse.json(
      { error: parsedName.error.issues[0]?.message ?? "Nama program studi tidak valid." },
      { status: 400 },
    );
  }

  try {
    if (!(await isRecruitmentOpen())) {
      return NextResponse.json(
        { error: "Penambahan program studi hanya tersedia saat pendaftaran dibuka." },
        { status: 403 },
      );
    }

    const token = "captchaToken" in body ? body.captchaToken : undefined;
    await verifyTurnstileToken(
      token,
      "registration",
      new URL(request.url).hostname,
    );
    const program = await saveStudyProgram(parsedName.data);
    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    if (error instanceof TurnstileVerificationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (isStudyProgramTableMissing(error)) {
      return NextResponse.json(
        { error: studyProgramMigrationMessage },
        { status: 503 },
      );
    }
    console.error("Study program save failed.", error);
    return NextResponse.json(
      { error: "Program studi gagal disimpan. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
