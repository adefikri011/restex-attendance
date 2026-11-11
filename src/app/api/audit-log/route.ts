import { NextResponse } from "next/server";
import { auditCategories, type AuditCategory } from "@/components/audit-log/audit-log-data";
import { getApiUser } from "@/lib/auth-guard";
import { getAuditLogPageData } from "@/lib/audit-log-service";

const ranges = ["7 hari", "30 hari", "Semua"] as const;

export async function GET(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk melihat audit log." },
      { status: access.status },
    );
  }

  const params = new URL(request.url).searchParams;
  const rangeValue = params.get("range") ?? "7 hari";
  const categoryValue = params.get("category") ?? "Semua";
  const offsetValue = Number(params.get("offset") ?? 0);
  if (
    !ranges.includes(rangeValue as (typeof ranges)[number]) ||
    (categoryValue !== "Semua" &&
      !auditCategories.includes(categoryValue as AuditCategory)) ||
    !Number.isInteger(offsetValue) ||
    offsetValue < 0 ||
    offsetValue > 100_000
  ) {
    return NextResponse.json({ error: "Filter audit log tidak valid." }, { status: 400 });
  }

  try {
    const data = await getAuditLogPageData({
      range: rangeValue as (typeof ranges)[number],
      category: categoryValue as "Semua" | AuditCategory,
      search: params.get("search") ?? "",
      offset: offsetValue,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Audit log retrieval failed.", error);
    return NextResponse.json(
      { error: "Audit log gagal dimuat. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
