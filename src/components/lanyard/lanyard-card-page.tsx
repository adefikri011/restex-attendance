"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, RefreshCw, ShieldCheck } from "lucide-react";
import type { Member } from "@/components/members/member-data";
import { exportLanyardCard } from "./export-lanyard-card";
import { LanyardCardForm } from "./lanyard-card-form";
import { LanyardCardPreview } from "./lanyard-card-preview";
import { renderLanyardCard } from "./render-lanyard-card";
import styles from "./lanyard-card.module.css";
import type { LanyardCardDetails } from "./types";

const qrOptions = {
  errorCorrectionLevel: "H" as const,
  margin: 1,
  width: 320,
  color: {
    dark: "#102e4a",
    light: "#ffffff",
  },
};

function getCardDetails(member: Member): LanyardCardDetails {
  return {
    id: member.id,
    name: member.name,
    nim: member.nim,
    division: member.division,
    cohort: member.cohort,
  };
}

type LanyardCardPageProps = {
  members: Member[];
  periodName: string | null;
};

function LanyardCardWorkspace({
  activeMembers,
  periodName,
}: {
  activeMembers: Member[];
  periodName: string;
}) {
  const initialMember = activeMembers[0];
  const [selectedMemberId, setSelectedMemberId] = useState(initialMember.id);
  const [details, setDetails] = useState(() => getCardDetails(initialMember));
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");
  const [renderedCard, setRenderedCard] = useState<
    { front: string; back: string; key: string } | null
  >(null);
  const [renderError, setRenderError] = useState<{ key: string; message: string } | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const requestId = useRef(0);
  const photoUrlRef = useRef("");
  const renderKey = JSON.stringify([details, photoUrl, qrDataUrl]);
  const currentRenderedCard = renderedCard?.key === renderKey ? renderedCard : null;

  const generateQr = useCallback(async (memberCode: string) => {
    const currentRequest = ++requestId.current;
    setQrDataUrl("");
    setQrError("");

    try {
      const response = await fetch(
        `/api/members/${encodeURIComponent(memberCode)}/qr-token`,
        { method: "POST" },
      );
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("token" in result) ||
        typeof result.token !== "string"
      ) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "QR anggota gagal disiapkan.";
        throw new Error(message);
      }
      const dataUrl = await QRCode.toDataURL(result.token, qrOptions);

      if (currentRequest === requestId.current) {
        setQrDataUrl(dataUrl);
        setQrError("");
      }
    } catch (error) {
      console.error("Gagal menyiapkan QR kartu anggota.", error);
      if (currentRequest === requestId.current) {
        setQrError(error instanceof Error ? error.message : "QR anggota gagal dibuat.");
      }
    }
  }, []);

  useEffect(() => {
    void generateQr(initialMember.id);
    return () => {
      requestId.current += 1;
    };
  }, [generateQr, initialMember.id]);

  useEffect(
    () => () => {
      if (photoUrlRef.current) {
        URL.revokeObjectURL(photoUrlRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    if (!qrDataUrl) return;

    renderLanyardCard(details, photoUrl, qrDataUrl)
      .then((card) => {
        if (!cancelled) setRenderedCard({ ...card, key: renderKey });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Gagal merender pratinjau kartu anggota.", error);
          setRenderError({
            key: renderKey,
            message: "Pratinjau kartu gagal dibuat. Silakan coba lagi.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [details, photoUrl, qrDataUrl, renderKey]);

  function updateField(field: keyof LanyardCardDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function selectMember(memberId: string) {
    const member = activeMembers.find((item) => item.id === memberId);
    if (!member) return;

    setSelectedMemberId(memberId);
    setDetails(getCardDetails(member));
    setQrDataUrl("");
    setQrError("");
    setPhotoName("");
    setPhotoUrl("");
    if (photoUrlRef.current) {
      URL.revokeObjectURL(photoUrlRef.current);
      photoUrlRef.current = "";
    }
    void generateQr(memberId);
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
    if (!currentRenderedCard) {
      setDownloadError("Pratinjau kartu belum siap. Coba muat ulang halaman.");
      return;
    }

    setIsDownloading(true);
    setDownloadError("");

    try {
      await exportLanyardCard(currentRenderedCard.front, currentRenderedCard.back, details.id);
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
          <span className={styles.eyebrow}>
            IDENTITAS ANGGOTA · PERIODE {periodName.replace("-", "—")}
          </span>
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
          </div>

          <div className={styles.previewStage}>
            <LanyardCardPreview
              details={details}
              frontImage={currentRenderedCard?.front ?? ""}
              backImage={currentRenderedCard?.back ?? ""}
            />
            {qrError && (
              <p className={styles.qrError} role="alert">
                {qrError}
              </p>
            )}
            {renderError?.key === renderKey && (
              <p className={styles.downloadError} role="alert">
                {renderError.message}
              </p>
            )}
            {downloadError && (
              <p className={styles.downloadError} role="alert">
                {downloadError}
              </p>
            )}
          </div>

          <div className={styles.previewActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => void generateQr(selectedMemberId)}>
              <RefreshCw size={16} aria-hidden="true" />
              Muat ulang QR
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
              disabled={!currentRenderedCard || isDownloading}
            >
              <Download size={16} aria-hidden="true" />
              {isDownloading ? "Menyiapkan PDF..." : "Unduh kartu (PDF)"}
            </button>
          </div>

          <p className={styles.previewNotice}>
            <ShieldCheck size={16} aria-hidden="true" />
            <span>
              QR milik anggota terpilih dan dapat dipindai pada sesi aktif. Perubahan data teks hanya untuk pratinjau.
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

export function LanyardCardPage({ members, periodName }: LanyardCardPageProps) {
  const activeMembers = members.filter((member) => member.status === "Aktif");

  if (!periodName || activeMembers.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.pageHeading}>
          <div>
            <span className={styles.eyebrow}>IDENTITAS ANGGOTA</span>
            <h1>Kartu Lanyard</h1>
            <p>Buat kartu dari data anggota yang terdaftar pada periode aktif.</p>
          </div>
        </header>
        <section className={styles.emptyMembers} role="status">
          <h2>Belum ada anggota aktif</h2>
          <p>
            Tambahkan anggota aktif pada periode berjalan terlebih dahulu, lalu
            kembali ke halaman ini untuk membuat kartu lanyard.
          </p>
        </section>
      </div>
    );
  }

  return (
    <LanyardCardWorkspace activeMembers={activeMembers} periodName={periodName} />
  );
}
