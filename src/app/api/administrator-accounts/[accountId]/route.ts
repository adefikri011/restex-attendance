import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { setAdministratorAccountActive } from "@/lib/administrator-account-service";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/administrator-accounts/[accountId]">,
) {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mengubah akun pengurus." },
      { status: access.status },
    );
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
    !("isActive" in body) ||
    typeof body.isActive !== "boolean"
  ) {
    return NextResponse.json({ error: "Status akun tidak valid." }, { status: 400 });
  }

  const { accountId } = await context.params;
  try {
    await setAdministratorAccountActive(accountId, body.isActive);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof Error &&
      (error.message.includes("sudah memiliki Ketua Divisi") ||
        error.message.includes("sudah memiliki PJ"))
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Administrator account status update failed.");
    return NextResponse.json(
      { error: "Status akun gagal diperbarui. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
