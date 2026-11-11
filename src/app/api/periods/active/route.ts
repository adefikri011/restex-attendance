import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { getActivePeriodName } from "@/lib/dashboard-service";

export async function GET() {
  const access = await getApiUser([
    "super-admin",
    "admin",
    "ketua-divisi",
    "pj-divisi",
  ]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk melihat periode aktif." },
      { status: access.status },
    );
  }

  try {
    return NextResponse.json({ periodName: await getActivePeriodName() });
  } catch (error) {
    console.error("Active period lookup failed.", error);
    return NextResponse.json(
      { error: "Periode aktif gagal dimuat." },
      { status: 500 },
    );
  }
}
