import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  activatePeriod,
  getPeriodsPageData,
  PeriodActivationError,
} from "@/lib/period-service";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ periodId: string }> },
) {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mengaktifkan periode." },
      { status: access.status },
    );
  }

  const { periodId } = await params;
  if (!isUuid(periodId)) {
    return NextResponse.json({ error: "ID periode tidak valid." }, { status: 400 });
  }

  try {
    await activatePeriod(periodId, access.user.id);
    const { periods } = await getPeriodsPageData();
    return NextResponse.json({ periods });
  } catch (error) {
    if (error instanceof PeriodActivationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (
      isRecord(error) &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      return NextResponse.json(
        { error: "Periode berubah bersamaan dengan proses lain. Muat ulang lalu coba lagi." },
        { status: 409 },
      );
    }
    console.error("Period activation failed.", error);
    return NextResponse.json(
      { error: "Periode gagal diaktifkan." },
      { status: 500 },
    );
  }
}
