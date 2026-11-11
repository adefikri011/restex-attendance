import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { createAttendanceQrToken, hashAttendanceQrToken } from "@/lib/attendance-qr-token";
import { writeAuditLog } from "@/lib/audit-log-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/members/[memberCode]/qr-token">,
) {
  const access = await getApiUser(["super-admin", "admin", "ketua-divisi", "pj-divisi"]);
  if (!access.user) {
    return NextResponse.json({ error: "Akses membuat QR anggota ditolak." }, { status: access.status });
  }
  const { memberCode } = await context.params;
  const isDivisionManager =
    access.user.role === "ketua-divisi" || access.user.role === "pj-divisi";
  const managedDivision = isDivisionManager ? access.user.managedDivision : null;
  if (isDivisionManager && !managedDivision) {
    return NextResponse.json({ error: "Akun belum ditugaskan ke divisi." }, { status: 403 });
  }

  try {
    const token = await prisma.$transaction(async (transaction) => {
      const activePeriod = await transaction.period.findFirst({
        where: { isActive: true },
        orderBy: { startDate: "desc" },
        select: { id: true },
      });
      if (!activePeriod) throw new Error("Tidak ada periode aktif.");

      const member = await transaction.member.findFirst({
        where: {
          memberCode,
          memberships: {
            some: {
              periodId: activePeriod.id,
              status: "ACTIVE",
              ...(managedDivision ? { division: managedDivision } : {}),
            },
          },
        },
        select: {
          id: true,
          memberCode: true,
          fullName: true,
          qrTokenHash: true,
          qrIssuedAt: true,
          qrRevokedAt: true,
        },
      });
      if (!member) throw new Error("Anggota aktif tidak ditemukan.");

      if (member.qrIssuedAt && member.qrTokenHash && !member.qrRevokedAt) {
        const existingToken = createAttendanceQrToken(member.id, member.qrIssuedAt.getTime());
        if (hashAttendanceQrToken(existingToken) === member.qrTokenHash) {
          return existingToken;
        }
      }

      const issuedAt = new Date();
      const newToken = createAttendanceQrToken(member.id, issuedAt.getTime());
      await transaction.member.update({
        where: { id: member.id },
        data: {
          qrTokenHash: hashAttendanceQrToken(newToken),
          qrIssuedAt: issuedAt,
          qrRevokedAt: null,
        },
      });
      await writeAuditLog(transaction, {
        actorId: access.user.id,
        action: "identity.qr_issued",
        entity: "identity",
        entityId: member.memberCode,
        newValue: {
          name: member.fullName,
          memberCode: member.memberCode,
          status: "QR aktif",
        },
      });
      return newToken;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ token });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return NextResponse.json(
        { error: "QR sedang disiapkan. Silakan coba kembali." },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message.includes("tidak ditemukan")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("periode aktif")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Member attendance QR issuance failed.");
    return NextResponse.json(
      { error: "QR anggota gagal disiapkan. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
