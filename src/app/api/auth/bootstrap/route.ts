import { randomUUID, timingSafeEqual } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

class BootstrapAlreadyCompleteError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAuthorized(request: Request, expectedToken: string) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;

  const providedToken = Buffer.from(authorization.slice(7));
  const configuredToken = Buffer.from(expectedToken);
  return (
    providedToken.length === configuredToken.length &&
    timingSafeEqual(providedToken, configuredToken)
  );
}

export async function POST(request: Request) {
  const bootstrapToken = process.env.INITIAL_ADMIN_TOKEN;
  if (!bootstrapToken || Buffer.byteLength(bootstrapToken) < 32) {
    return NextResponse.json(
      { error: "Bootstrap akun awal tidak dikonfigurasi." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request, bootstrapToken)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ error: "Permintaan terlalu besar." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Data akun tidak valid." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (
    name.length < 2 ||
    name.length > 120 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.trim().length < 12 ||
    password.length > 128
  ) {
    return NextResponse.json(
      { error: "Nama, email, atau kata sandi tidak memenuhi ketentuan." },
      { status: 400 },
    );
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(password);
  } catch (error) {
    console.error("Initial Super Admin password hashing failed.", error);
    return NextResponse.json(
      { error: "Akun awal gagal dibuat. Periksa konfigurasi server." },
      { status: 500 },
    );
  }
  const userId = randomUUID();

  try {
    await prisma.$transaction(
      async (transaction) => {
        const existingSuperAdmin = await transaction.user.count({
          where: { role: "SUPER_ADMIN" },
        });
        if (existingSuperAdmin > 0) {
          throw new BootstrapAlreadyCompleteError();
        }

        await transaction.user.create({
          data: {
            id: userId,
            name,
            email,
            emailVerified: true,
            role: "SUPER_ADMIN",
            isActive: true,
            accounts: {
              create: {
                id: randomUUID(),
                accountId: userId,
                providerId: "credential",
                password: passwordHash,
              },
            },
          },
        });
      },
      { isolationLevel: "Serializable" },
    );

    return NextResponse.json({ created: true }, { status: 201 });
  } catch (error) {
    if (error instanceof BootstrapAlreadyCompleteError) {
      return NextResponse.json(
        { error: "Super Admin sudah tersedia; bootstrap telah ditutup." },
        { status: 409 },
      );
    }

    const errorCode =
      isRecord(error) && typeof error.code === "string" ? error.code : undefined;
    if (errorCode === "P2002") {
      return NextResponse.json(
        { error: "Email tersebut sudah terdaftar." },
        { status: 409 },
      );
    }
    if (errorCode === "P2034") {
      return NextResponse.json(
        { error: "Bootstrap sedang diproses. Silakan coba kembali." },
        { status: 409 },
      );
    }

    console.error("Initial Super Admin bootstrap failed.", error);
    return NextResponse.json(
      { error: "Akun awal gagal dibuat. Periksa konfigurasi server." },
      { status: 500 },
    );
  }
}
