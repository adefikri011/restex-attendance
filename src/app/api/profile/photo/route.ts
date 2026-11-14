import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  deleteProfileImage,
  getProfileImage,
  isProfileObjectKey,
  putProfileImage,
  R2NotConfiguredError,
} from "@/lib/r2-storage";
import { prisma } from "@/lib/prisma";

const maximumImageSize = 5 * 1024 * 1024;

async function getProfilePhotoKey(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  return user?.image && isProfileObjectKey(user.image, userId) ? user.image : null;
}

export async function GET() {
  const access = await getApiUser([
    "super-admin",
    "admin",
    "ketua-divisi",
    "pj-divisi",
    "anggota",
  ]);
  if (!access.user) {
    return NextResponse.json({ error: "Silakan masuk untuk melihat foto profil." }, {
      status: access.status,
    });
  }

  try {
    const key = await getProfilePhotoKey(access.user.id);
    if (!key) return NextResponse.json({ error: "Foto profil belum tersedia." }, { status: 404 });

    const object = await getProfileImage(key);
    if (!object.Body) {
      return NextResponse.json({ error: "Foto profil tidak ditemukan." }, { status: 404 });
    }

    return new Response(object.Body.transformToWebStream(), {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof R2NotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Profile image retrieval failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Foto profil gagal dimuat. Silakan coba kembali." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  const access = await getApiUser([
    "super-admin",
    "admin",
    "ketua-divisi",
    "pj-divisi",
    "anggota",
  ]);
  if (!access.user) {
    return NextResponse.json({ error: "Silakan masuk untuk mengunggah foto." }, {
      status: access.status,
    });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumImageSize + 32_768) {
    return NextResponse.json({ error: "Ukuran foto maksimal 5 MB." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Format unggahan tidak valid." }, { status: 400 });
  }

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Pilih foto yang ingin diunggah." }, { status: 400 });
  }
  if (file.size === 0 || file.size > maximumImageSize) {
    return NextResponse.json({ error: "Ukuran foto harus antara 1 byte dan 5 MB." }, {
      status: 413,
    });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpeg =
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  if (!isJpeg) {
    return NextResponse.json(
      { error: "Foto hasil crop harus berformat JPEG yang valid." },
      { status: 415 },
    );
  }

  const key = `profiles/${access.user.id}/profile.jpg`;
  let previousKey: string | null = null;
  let objectUploaded = false;

  try {
    previousKey = await getProfilePhotoKey(access.user.id);
    await putProfileImage(key, bytes, "image/jpeg");
    objectUploaded = true;
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: access.user.id },
        data: { image: key },
      });
      await transaction.member.updateMany({
        where: {
          userId: access.user.id,
          photoUrl: { in: [key, ...(previousKey ? [previousKey] : [])] },
        },
        data: { photoUrl: null },
      });
    });
  } catch (error) {
    if (objectUploaded && previousKey !== key) {
      try {
        await deleteProfileImage(key);
      } catch (cleanupError) {
        console.error("Temporary profile image cleanup failed.", {
          name: cleanupError instanceof Error ? cleanupError.name : "UnknownError",
        });
      }
    }
    if (error instanceof R2NotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Profile image upload failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Foto profil gagal disimpan. Periksa koneksi penyimpanan lalu coba kembali." },
      { status: 502 },
    );
  }

  if (previousKey && previousKey !== key) {
    try {
      await deleteProfileImage(previousKey);
    } catch (error) {
      console.error("Previous profile image deletion failed.", {
        name: error instanceof Error ? error.name : "UnknownError",
      });

      try {
        await prisma.$transaction(async (transaction) => {
          await transaction.user.update({
            where: { id: access.user.id },
            data: { image: previousKey },
          });
        });
        await deleteProfileImage(key);
      } catch (rollbackError) {
        console.error("Profile photo replacement rollback failed.", {
          name: rollbackError instanceof Error ? rollbackError.name : "UnknownError",
        });
        return NextResponse.json(
          {
            error:
              "Foto baru tersimpan, tetapi foto lama belum dapat diganti dengan aman. Hubungi administrator.",
          },
          { status: 502 },
        );
      }

      return NextResponse.json(
        { error: "Foto lama gagal dihapus. Perubahan foto dibatalkan; silakan coba lagi." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ imageUrl: "/api/profile/photo" });
}

export async function DELETE() {
  const access = await getApiUser([
    "super-admin",
    "admin",
    "ketua-divisi",
    "pj-divisi",
    "anggota",
  ]);
  if (!access.user) {
    return NextResponse.json({ error: "Silakan masuk untuk menghapus foto." }, {
      status: access.status,
    });
  }

  try {
    const key = await getProfilePhotoKey(access.user.id);
    if (key) await deleteProfileImage(key);
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: access.user.id },
        data: { image: null },
      });
      if (key) {
        await transaction.member.updateMany({
          where: { userId: access.user.id, photoUrl: key },
          data: { photoUrl: null },
        });
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile image removal failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Foto profil gagal dihapus. Silakan coba kembali." },
      { status: 502 },
    );
  }
}
