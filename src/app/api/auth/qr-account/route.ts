import { NextResponse } from "next/server";
import {
  hashAttendanceQrToken,
  verifyAttendanceQrToken,
} from "@/lib/attendance-qr-token";
import { prisma } from "@/lib/prisma";

const invalidQrMessage =
  "QR tidak valid atau akun belum aktif. Silakan gunakan login email.";

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json(
      { error: "Permintaan QR tidak valid." },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  }

  const origin = request.headers.get("origin");
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const requestUrl = new URL(request.url);
  const requestHost = forwardedHost || request.headers.get("host");
  const requestProtocol = forwardedProtocol || requestUrl.protocol.slice(0, -1);
  let isSameOrigin = false;

  if (origin && requestHost && ["http", "https"].includes(requestProtocol)) {
    try {
      const parsedOrigin = new URL(origin);
      isSameOrigin =
        parsedOrigin.origin === `${requestProtocol}://${requestHost}` &&
        parsedOrigin.protocol === `${requestProtocol}:`;
    } catch {
      isSameOrigin = false;
    }
  }

  if (!isSameOrigin) {
    return NextResponse.json(
      { error: "Permintaan QR tidak valid." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > 1024) {
    return NextResponse.json(
      { error: "Permintaan QR terlalu besar." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Permintaan QR tidak valid." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const token =
    typeof payload === "object" &&
    payload !== null &&
    "token" in payload &&
    typeof payload.token === "string" &&
    payload.token.length <= 256
      ? payload.token
      : null;
  if (!token) {
    return NextResponse.json(
      { error: "QR tidak dapat dibaca. Coba pindai kembali." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const verified = verifyAttendanceQrToken(token);
    if (!verified) {
      return NextResponse.json(
        { error: invalidQrMessage },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const member = await prisma.member.findFirst({
      where: {
        id: verified.memberId,
        qrTokenHash: hashAttendanceQrToken(token),
        qrIssuedAt: new Date(verified.issuedAt),
        qrRevokedAt: null,
        memberships: {
          some: {
            status: "ACTIVE",
            period: { isActive: true },
          },
        },
        user: { is: { isActive: true } },
      },
      select: {
        fullName: true,
        user: { select: { email: true } },
      },
    });

    if (!member?.user?.email) {
      return NextResponse.json(
        { error: invalidQrMessage },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { email: member.user.email, name: member.fullName },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Login QR account lookup failed.", error);
    return NextResponse.json(
      { error: "QR belum dapat diverifikasi. Silakan coba lagi." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
