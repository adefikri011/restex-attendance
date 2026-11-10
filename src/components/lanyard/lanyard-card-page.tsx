"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, RefreshCw, ShieldCheck } from "lucide-react";
import { initialMembers, type Member } from "@/components/members/member-data";
import { exportLanyardCard } from "./export-lanyard-card";
import { LanyardCardForm } from "./lanyard-card-form";
import { LanyardCardPreview } from "./lanyard-card-preview";
import styles from "./lanyard-card.module.css";
import type { LanyardCardDetails } from "./types";

const activeMembers = initialMembers.filter((member) => member.status === "Aktif");
const initialMember = activeMembers[0];
const qrOptions = {
  errorCorrectionLevel: "H" as const,
  margin: 1,
  width: 320,
  color: {
    dark: "#102e4a",
    light: "#ffffff",
  },
};

function createPreviewQr() {
  if (!globalThis.crypto?.randomUUID) {
    return Promise.reject(new Error("Browser ini belum mendukung pembuatan token acak."));
  }

  const token = `restex-preview:${globalThis.crypto.randomUUID()}`;
  return QRCode.toDataURL(token, qrOptions);
}

function getCardDetails(member: Member): LanyardCardDetails {
  return {
    id: member.id,
    name: member.name,
    nim: member.nim,
    division: member.division,
    cohort: member.cohort,
  };
}

export function LanyardCardPage() {
  const [selectedMemberId, setSelectedMemberId] = useState(initialMember.id);
  const [details, setDetails] = useState(() => getCardDetails(initialMember));
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const requestId = useRef(0);
  const photoUrlRef = useRef("");
  const frontFaceRef = useRef<HTMLElement | null>(null);
  const backFaceRef = useRef<HTMLElement | null>(null);

  const generateQr = useCallback(async () => {
    const currentRequest = ++requestId.current;

    try {
      const dataUrl = await createPreviewQr();

      if (currentRequest === requestId.current) {
        setQrDataUrl(dataUrl);
        setQrError("");
      }
    } catch (error) {
      console.error("Gagal membuat QR pratinjau kartu anggota.", error);
      if (currentRequest === requestId.current) {
        setQrError("QR pratinjau gagal dibuat. Coba muat ulang halaman.");
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const currentRequest = ++requestId.current;

    createPreviewQr()
      .then((dataUrl) => {
        if (!cancelled && currentRequest === requestId.current) {
          setQrDataUrl(dataUrl);
          setQrError("");
        }
      })
      .catch((error: unknown) => {
        console.error("Gagal membuat QR pratinjau kartu anggota.", error);
        if (!cancelled && currentRequest === requestId.current) {
          setQrError("QR pratinjau gagal dibuat. Coba muat ulang halaman.");
        }
      });

    return () => {
      cancelled = true;
      requestId.current += 1;
    };
  }, []);

  useEffect(
    () => () => {
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current);
      }
    },
    [],
  );

  function updateField(field: keyof LanyardCardDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function selectMember(memberId: string) {
    const member = activeMembers.find((item) => item.id === memberId);
    if (!member) return;

    setSelectedMemberId(memberId);
    setDetails(getCardDetails(member));
    setPhotoName("");
    setPhotoUrl("");
    if (photoUrlRef.current) {
      URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = "";
    }
    void generateQr();
  }

  function selectPhoto(file: File | undefined) {
    if (photoUrlRef.current) {
      URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = "";
    }

    if (!file) {
      setPhotoName("");
      setPhotoUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    photoUrlRef.current = objectUrl;
    setPhotoName(file.name);
    setPhotoUrl(objectUrl);
  }

  function downloadQr() {
    if (!qrDataUrl) return;

    const encodedImage = qrDataUrl.split(",")[1];
    const binaryImage = atob(encodedImage);
    const imageBytes = Uint8Array.from(binaryImage, (character) => character.charCodeAt(0));
    const objectUrl = URL.createObjectURL(new Blob([imageBytes], { type: "image/png" }));
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `qr-${details.id}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function downloadCard() {
    const frontFace = frontFaceRef.current;
    const backFace = backFaceRef.current;

    if (!frontFace || !backFace) {
      setDownloadError("Pratinjau kartu belum siap. Coba muat ulang halaman.");
      return;
    }

    setIsDownloading(true);
    setDownloadError("");

    try {
      await exportLanyardCard(frontFace, backFace, details.id);
    } catch (error) {
      console.error("Gagal mengunduh PDF kartu anggota.", error);
      setDownloadError("PDF kartu gagal dibuat. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.eyebrow}>IDENTITAS ANGGOTA · PERIODE 2026—2027</span>
          <h1>Kartu Lanyard</h1>
          <p>Sesuaikan identitas anggota dan lihat pratinjau kartu secara langsung.</p>
        </div>
        <span className={styles.previewBadge}>
          <span aria-hidden="true" />
          Mode pratinjau
        </span>
      </header>

      <div className={styles.workspace}>
        <LanyardCardForm
          members={activeMembers}
          selectedMemberId={selectedMemberId}
          details={details}
          photoName={photoName}
          onMemberChange={selectMember}
          onFieldChange={updateField}
          onPhotoChange={selectPhoto}
        />

        <section className={styles.previewPanel} aria-labelledby="preview-title">
          <div className={styles.previewHeading}>
            <div>
              <span className={styles.panelEyebrow}>HASIL DESAIN</span>
              <h2 id="preview-title">Pratinjau kartu</h2>
            </div>
            <span className={styles.liveIndicator}>
              <span aria-hidden="true" />
              Langsung
            </span>
          </div>

          <div className={styles.previewStage}>
            <LanyardCardPreview
              details={details}
              photoUrl={photoUrl}
              qrDataUrl={qrDataUrl}
              frontFaceRef={frontFaceRef}
              backFaceRef={backFaceRef}
            />
            {qrError && (
              <p className={styles.qrError} role="alert">
                {qrError}
              </p>
            )}
            {downloadError && (
              <p className={styles.downloadError} role="alert">
                {downloadError}
              </p>
            )}
          </div>

          <div className={styles.previewActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => void generateQr()}>
              <RefreshCw size={16} aria-hidden="true" />
              Buat QR baru
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={downloadQr}
              disabled={!qrDataUrl}
            >
              <Download size={16} aria-hidden="true" />
              Unduh QR
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => void downloadCard()}
              disabled={!qrDataUrl || isDownloading}
            >
              <Download size={16} aria-hidden="true" />
              {isDownloading ? "Menyiapkan PDF..." : "Unduh kartu (PDF)"}
            </button>
          </div>

          <p className={styles.previewNotice}>
            <ShieldCheck size={16} aria-hidden="true" />
            <span>
              QR ini hanya untuk pratinjau, berisi token acak tanpa NIM, dan belum terhubung ke
              data absensi.
            </span>
          </p>
          <p className={styles.downloadHint}>
            PDF berisi sisi depan dan belakang berdampingan, kartu saja (54 × 86 mm per sisi).
          </p>
        </section>
      </div>
    </div>
  );
}
