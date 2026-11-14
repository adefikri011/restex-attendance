"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type PointerEvent,
} from "react";
import {
  Camera,
  Check,
  CircleUserRound,
  ImagePlus,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import type { AppRoleId } from "@/components/auth/role-config";
import { notifications } from "@/lib/notifications";
import styles from "./profile-page.module.css";

const roleLabels: Record<AppRoleId, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  "ketua-divisi": "Ketua Divisi",
  "pj-divisi": "PJ Divisi",
  "calon-anggota": "Calon Anggota",
  anggota: "Anggota",
};

type ApiResult = {
  error?: string;
  warning?: string;
};

export function ProfilePage({
  name,
  email,
  role,
  hasMemberRecord,
  imageUrl,
}: {
  name: string;
  email: string;
  role: AppRoleId;
  hasMemberRecord: boolean;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const cropFrame = useRef<HTMLDivElement>(null);
  const [fullName, setFullName] = useState(name);
  const [photoSource, setPhotoSource] = useState<{
    image: HTMLImageElement;
    previewUrl: string;
    width: number;
    height: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [photoSelection, setPhotoSelection] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [dragOrigin, setDragOrigin] = useState<{
    pointerId: number;
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [hasRemovedPhoto, setHasRemovedPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const photoPreview = hasRemovedPhoto
    ? null
    : photoSelection?.previewUrl ?? imageUrl;

  useEffect(() => {
    if (!photoSource) return;
    return () => URL.revokeObjectURL(photoSource.previewUrl);
  }, [photoSource]);

  useEffect(() => {
    if (!photoSelection) return;
    return () => URL.revokeObjectURL(photoSelection.previewUrl);
  }, [photoSelection]);

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      notifications.warning("Format foto belum didukung", "Pilih foto JPEG, PNG, atau WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifications.warning("Ukuran foto terlalu besar", "Ukuran foto maksimal 5 MB.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      setPhotoSelection(null);
      setPhotoSource({
        image,
        previewUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      notifications.error("Foto tidak dapat dibuka", "Silakan pilih gambar lain.");
    };
    image.src = previewUrl;
    setHasRemovedPhoto(false);
  }

  function moveCrop(event: PointerEvent<HTMLDivElement>) {
    if (!dragOrigin || !photoSource || !cropFrame.current) return;
    const frame = cropFrame.current.getBoundingClientRect();
    const coverScale = Math.max(frame.width / photoSource.width, frame.height / photoSource.height);
    const renderedWidth = photoSource.width * coverScale * photoSource.zoom;
    const renderedHeight = photoSource.height * coverScale * photoSource.zoom;
    const maxX = Math.max(0, (renderedWidth - frame.width) / 2);
    const maxY = Math.max(0, (renderedHeight - frame.height) / 2);
    setPhotoSource((current) =>
      current
        ? {
            ...current,
            offsetX: Math.max(-maxX, Math.min(maxX, dragOrigin.offsetX + event.clientX - dragOrigin.pointerX)),
            offsetY: Math.max(-maxY, Math.min(maxY, dragOrigin.offsetY + event.clientY - dragOrigin.pointerY)),
          }
        : current,
    );
  }

  function startCropDrag(event: PointerEvent<HTMLDivElement>) {
    if (!photoSource) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragOrigin({
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: photoSource.offsetX,
      offsetY: photoSource.offsetY,
    });
  }

  function changeZoom(zoom: number) {
    if (!photoSource || !cropFrame.current) return;
    const frame = cropFrame.current.getBoundingClientRect();
    const coverScale = Math.max(frame.width / photoSource.width, frame.height / photoSource.height);
    const renderedWidth = photoSource.width * coverScale * zoom;
    const renderedHeight = photoSource.height * coverScale * zoom;
    const maxX = Math.max(0, (renderedWidth - frame.width) / 2);
    const maxY = Math.max(0, (renderedHeight - frame.height) / 2);
    setPhotoSource((current) =>
      current
        ? {
            ...current,
            zoom,
            offsetX: Math.max(-maxX, Math.min(maxX, current.offsetX)),
            offsetY: Math.max(-maxY, Math.min(maxY, current.offsetY)),
          }
        : current,
    );
  }

  async function createCroppedPhoto() {
    if (!photoSource || !cropFrame.current) return null;

    const frame = cropFrame.current.getBoundingClientRect();
    const outputWidth = 900;
    const outputHeight = 1238;
    const coverScale = Math.max(frame.width / photoSource.width, frame.height / photoSource.height);
    const renderedWidth = photoSource.width * coverScale * photoSource.zoom;
    const renderedHeight = photoSource.height * coverScale * photoSource.zoom;
    const left = (frame.width - renderedWidth) / 2 + photoSource.offsetX;
    const top = (frame.height - renderedHeight) / 2 + photoSource.offsetY;
    const sourceX = (-left / renderedWidth) * photoSource.width;
    const sourceY = (-top / renderedHeight) * photoSource.height;
    const sourceWidth = (frame.width / renderedWidth) * photoSource.width;
    const sourceHeight = (frame.height / renderedHeight) * photoSource.height;
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Editor foto tidak dapat disiapkan.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      photoSource.image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) throw new Error("Foto gagal diproses. Silakan pilih foto lain.");
    return new File([blob], "profile.jpg", { type: "image/jpeg" });
  }

  async function applyPhotoCrop() {
    try {
      const croppedPhoto = await createCroppedPhoto();
      if (!croppedPhoto) return;
      setPhotoSelection({
        file: croppedPhoto,
        previewUrl: URL.createObjectURL(croppedPhoto),
      });
      setPhotoSource(null);
    } catch (error) {
      notifications.error(
        "Foto gagal diproses",
        error instanceof Error ? error.message : "Silakan pilih foto lain.",
      );
    }
  }

  function cancelPhotoCrop() {
    setPhotoSource(null);
    if (!imageUrl && !photoSelection) setHasRemovedPhoto(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    let updatedName = false;
    let photoWarning: string | undefined;

    try {
      const profileResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName }),
      });
      const profileResult = (await profileResponse.json()) as ApiResult;
      if (!profileResponse.ok) {
        throw new Error(profileResult.error ?? "Nama profil gagal diperbarui.");
      }
      updatedName = true;

      if (photoSelection) {
        const formData = new FormData();
        formData.set("photo", photoSelection.file);
        const photoResponse = await fetch("/api/profile/photo", {
          method: "POST",
          body: formData,
        });
        const photoResult = (await photoResponse.json()) as ApiResult;
        if (!photoResponse.ok) {
          throw new Error(
            updatedName
              ? `Nama berhasil disimpan, tetapi foto belum tersimpan: ${photoResult.error ?? "silakan coba kembali."}`
              : photoResult.error ?? "Foto profil gagal disimpan.",
          );
        }
        photoWarning = photoResult.warning;
        setPhotoSelection(null);
      }

      setPhotoSelection(null);
      if (photoWarning) {
        notifications.warning("Profil diperbarui dengan catatan", photoWarning);
      } else {
        notifications.success("Profil berhasil diperbarui");
      }
      router.refresh();
    } catch (error) {
      if (updatedName) router.refresh();
      notifications.error(
        "Profil gagal diperbarui",
        error instanceof Error ? error.message : "Silakan coba kembali.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removePhoto() {
    setIsRemovingPhoto(true);
    try {
      const response = await fetch("/api/profile/photo", { method: "DELETE" });
      const result = (await response.json()) as ApiResult;
      if (!response.ok) throw new Error(result.error ?? "Foto profil gagal dihapus.");
      setPhotoSelection(null);
      setPhotoSource(null);
      setHasRemovedPhoto(true);
      if (result.warning) {
        notifications.warning("Foto dihapus dengan catatan", result.warning);
      } else {
        notifications.success("Foto profil berhasil dihapus");
      }
      router.refresh();
    } catch (error) {
      notifications.error(
        "Foto profil gagal dihapus",
        error instanceof Error ? error.message : "Silakan coba kembali.",
      );
    } finally {
      setIsRemovingPhoto(false);
    }
  }

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className={styles.profilePage}>
      <header className={styles.pageHeading}>
        <span className={styles.eyebrow}>AKUN RESTEX</span>
        <h1>Profil saya</h1>
        <p>Perbarui identitas dan foto yang digunakan di ruang kerja RESTEX.</p>
      </header>

      <form className={styles.profileLayout} onSubmit={handleSubmit}>
        <section className={styles.photoPanel} aria-labelledby="profile-photo-title">
          <div className={styles.panelHeading}>
            <span className={styles.headingIcon} aria-hidden="true">
              <Camera size={17} />
            </span>
            <div>
              <h2 id="profile-photo-title">Foto profil</h2>
              <p>Gunakan foto yang jelas dan mudah dikenali.</p>
            </div>
          </div>

          <div className={styles.photoContent}>
            <div className={styles.avatarPreview}>
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Pratinjau foto profil"
                  fill
                  sizes="128px"
                  loading="eager"
                  unoptimized
                />
              ) : (
                <span aria-hidden="true">{initials || <CircleUserRound size={36} />}</span>
              )}
            </div>
            <div className={styles.photoActions}>
              <label className={styles.uploadButton}>
                <ImagePlus size={16} aria-hidden="true" />
                {photoPreview ? "Ganti foto" : "Pilih foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={choosePhoto}
                />
              </label>
              {photoPreview && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => void removePhoto()}
                  disabled={isRemovingPhoto || isSaving}
                >
                  <Trash2 size={15} aria-hidden="true" />
                  {isRemovingPhoto ? "Menghapus..." : "Hapus"}
                </button>
              )}
              <span className={styles.photoHint}>JPEG, PNG, atau WebP · Maks. 5 MB</span>
            </div>
          </div>
          {photoSource && (
            <div className={styles.cropEditor}>
              <div className={styles.cropHeading}>
                <strong>Sesuaikan foto kartu</strong>
                <span>Geser foto untuk mengatur posisinya.</span>
              </div>
              <div
                ref={cropFrame}
                className={styles.cropFrame}
                onPointerDown={startCropDrag}
                onPointerMove={moveCrop}
                onPointerUp={() => setDragOrigin(null)}
                onPointerCancel={() => setDragOrigin(null)}
                role="img"
                aria-label="Area crop foto kartu"
              >
                <Image
                  src={photoSource.previewUrl}
                  alt=""
                  fill
                  sizes="260px"
                  unoptimized
                  draggable={false}
                  style={{
                    objectFit: "cover",
                    transform: `translate(${photoSource.offsetX}px, ${photoSource.offsetY}px) scale(${photoSource.zoom})`,
                  }}
                />
                <span className={styles.cropFrameBorder} />
              </div>
              <label className={styles.zoomControl}>
                <Minus size={15} aria-hidden="true" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={photoSource.zoom}
                  aria-label="Perbesar foto"
                  onChange={(event) => changeZoom(Number(event.target.value))}
                />
                <Plus size={15} aria-hidden="true" />
              </label>
              <div className={styles.cropActions}>
                <button type="button" className={styles.cancelCropButton} onClick={cancelPhotoCrop}>
                  Batal
                </button>
                <button type="button" className={styles.applyCropButton} onClick={() => void applyPhotoCrop()}>
                  Gunakan foto
                </button>
              </div>
            </div>
          )}
          {hasMemberRecord && (
            <p className={styles.syncNote}>
              <Check size={15} aria-hidden="true" />
              Foto ini hanya digunakan untuk profil akun Anda.
            </p>
          )}
        </section>

        <section className={styles.detailsPanel} aria-labelledby="profile-details-title">
          <div className={styles.panelHeading}>
            <span className={styles.headingIcon} aria-hidden="true">
              <CircleUserRound size={17} />
            </span>
            <div>
              <h2 id="profile-details-title">Informasi akun</h2>
              <p>Nama yang diperbarui akan mengikuti identitas anggota.</p>
            </div>
          </div>

          <div className={styles.fields}>
            <label className={styles.field}>
              <span>Nama lengkap</span>
              <input
                autoComplete="name"
                maxLength={120}
                minLength={2}
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Email akun</span>
              <input value={email} readOnly aria-readonly="true" />
              <small>Email dikelola administrator dan tidak dapat diubah di sini.</small>
            </label>
            <label className={styles.field}>
              <span>Peran</span>
              <input value={roleLabels[role]} readOnly aria-readonly="true" />
            </label>
          </div>

          <div className={styles.formFooter}>
            <span>Foto profil disimpan secara privat.</span>
            <button type="submit" className={styles.saveButton} disabled={isSaving || isRemovingPhoto}>
              {isSaving ? "Menyimpan..." : "Simpan perubahan"}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
