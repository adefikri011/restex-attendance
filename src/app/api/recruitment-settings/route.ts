import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import type { RecruitmentSettings } from "@/lib/recruitment";
import {
  getRecruitmentSettings,
  RecruitmentSettingsError,
  updateRecruitmentSettings,
} from "@/lib/recruitment-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRecruitmentSettings(value: unknown): value is RecruitmentSettings {
  return (
    isRecord(value) &&
    typeof value.open === "boolean" &&
    (typeof value.opensAt === "string" ||
      value.opensAt === undefined) &&
    (typeof value.closesAt === "string" ||
      value.closesAt === undefined) &&
    typeof value.registerUrl === "string" &&
    typeof value.notifyUrl === "string"
  );
}

export async function GET() {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Admin dan Super Admin yang dapat mengatur pendaftaran." },
      { status: access.status },
    );
  }

  try {
    return NextResponse.json({ settings: await getRecruitmentSettings() });
  } catch (error) {
    console.error("Recruitment settings lookup failed.", error);
    return NextResponse.json(
      { error: "Pengaturan pendaftaran gagal dimuat." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Admin dan Super Admin yang dapat mengubah pendaftaran." },
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
  if (!isRecord(body) || !isRecruitmentSettings(body.settings)) {
    return NextResponse.json(
      { error: "Pengaturan pendaftaran tidak lengkap atau tidak valid." },
      { status: 400 },
    );
  }

  try {
    const settings = await updateRecruitmentSettings(
      body.settings,
      access.user.id,
    );
    revalidateTag("recruitment-settings", { expire: 0 });
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof RecruitmentSettingsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Recruitment settings update failed.", error);
    return NextResponse.json(
      { error: "Pengaturan pendaftaran gagal disimpan." },
      { status: 500 },
    );
  }
}
