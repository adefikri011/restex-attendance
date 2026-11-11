import { NextResponse } from "next/server";
import type { ReportRange } from "@/components/reports/report-data";
import { getApiUser } from "@/lib/auth-guard";
import { getReportsPageData } from "@/lib/report-service";

const reportRanges: ReportRange[] = ["Bulan ini", "Semester I", "Seluruh periode"];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const access = await getApiUser(["super-admin", "admin", "ketua-divisi"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk melihat laporan." },
      { status: access.status },
    );
  }

  const params = new URL(request.url).searchParams;
  const periodId = params.get("periodId") ?? undefined;
  const range = params.get("range") ?? "Bulan ini";
  if (
    (periodId && !uuidPattern.test(periodId)) ||
    !reportRanges.includes(range as ReportRange)
  ) {
    return NextResponse.json({ error: "Filter laporan tidak valid." }, { status: 400 });
  }

  try {
    const data = await getReportsPageData(access.user, periodId, range as ReportRange);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Periode tidak ditemukan.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Report data retrieval failed.", error);
    return NextResponse.json(
      { error: "Laporan gagal dimuat. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
