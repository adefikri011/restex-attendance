import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  createPeriod,
  getPeriodsPageData,
  PeriodConflictError,
  PeriodInputError,
} from "@/lib/period-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET() {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk melihat periode." },
      { status: access.status },
    );
  }

  const data = await getPeriodsPageData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk membuat periode." },
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
    typeof body.startDate !== "string" ||
    typeof body.endDate !== "string"
  ) {
    return NextResponse.json(
      { error: "Tanggal mulai dan tanggal selesai wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const period = await createPeriod({
      startDate: body.startDate,
      endDate: body.endDate,
    }, access.user.id);
    return NextResponse.json({ period }, { status: 201 });
  } catch (error) {
    if (error instanceof PeriodInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof PeriodConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      return NextResponse.json(
        { error: "Periode bertabrakan dengan periode yang sudah tersimpan." },
        { status: 409 },
      );
    }
    console.error("Period creation failed.", error);
    return NextResponse.json({ error: "Periode gagal disimpan." }, { status: 500 });
  }
}
