import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";

export async function GET() {
  const access = await getApiUser();
  if (!access.user) {
    return NextResponse.json(
      { error: "Sesi pengguna tidak valid." },
      { status: access.status },
    );
  }
  return NextResponse.json({
    role: access.user.role,
    pages: access.user.accessiblePages,
  });
}
