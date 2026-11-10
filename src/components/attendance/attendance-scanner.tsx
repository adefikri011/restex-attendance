"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Camera, CircleAlert, ScanLine } from "lucide-react";
import type { IDetectedBarcode, IScannerError } from "@yudiel/react-qr-scanner";
import styles from "./attendance-session-detail.module.css";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((module) => module.Scanner),
  { ssr: false, loading: () => <div className={styles.cameraLoading}>Menyiapkan kamera...</div> },
);

type AttendanceScannerProps = {
  sessionId: string;
  onRecorded: (attendance: { memberCode: string; name: string; recordedBy: string }) => void;
};

function isAttendanceResponse(
  value: unknown,
): value is {
  attendance: { memberCode: string; name: string; recordedBy: string };
} {
  if (typeof value !== "object" || value === null || !("attendance" in value)) {
    return false;
  }
  const attendance = value.attendance;
  return (
    typeof attendance === "object" &&
    attendance !== null &&
    "memberCode" in attendance &&
    typeof attendance.memberCode === "string" &&
    "name" in attendance &&
    typeof attendance.name === "string" &&
    "recordedBy" in attendance &&
    typeof attendance.recordedBy === "string"
  );
}

export function AttendanceScanner({
  sessionId,
  onRecorded,
}: AttendanceScannerProps) {
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [cameraConstraints, setCameraConstraints] =
    useState<MediaTrackConstraints>({
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    });
  const inFlight = useRef(false);
  const recentTokens = useRef(new Map<string, number>());

  async function handleScan(codes: IDetectedBarcode[]) {
    const token = codes.find((code) => code.rawValue)?.rawValue;
    if (!token || inFlight.current) return;
    const lastSeen = recentTokens.current.get(token) ?? 0;
    if (Date.now() - lastSeen < 2500) return;
    recentTokens.current.set(token, Date.now());
    setCameraError("");
    inFlight.current = true;
    setIsProcessing(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/attendance/sessions/${sessionId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result: unknown = await response.json();
      if (!response.ok || !isAttendanceResponse(result)) {
        const errorMessage =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "QR tidak dapat dicatat.";
        setMessage({ text: errorMessage, isError: true });
        return;
      }

      const attendance = result.attendance;
      onRecorded({
        memberCode: attendance.memberCode,
        name: attendance.name,
        recordedBy: attendance.recordedBy,
      });
      setMessage({ text: `${attendance.name} berhasil tercatat hadir.`, isError: false });
    } catch {
      setMessage({ text: "Layanan absensi tidak dapat dihubungi.", isError: true });
    } finally {
      inFlight.current = false;
      setIsProcessing(false);
    }
  }

  function handleCameraError(error: IScannerError) {
    if (error.kind === "overconstrained" && cameraConstraints.facingMode) {
      setCameraConstraints({
        width: { ideal: 640 },
        height: { ideal: 480 },
      });
      setCameraError("");
      setCameraAttempt((attempt) => attempt + 1);
      return;
    }

    const messages = {
      "permission-denied": "Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.",
      "no-camera": "Kamera tidak ditemukan. Pastikan perangkat memiliki kamera dan browser dapat mengaksesnya.",
      "in-use": "Kamera sedang digunakan aplikasi atau tab lain. Tutup aplikasi tersebut, lalu coba lagi.",
      overconstrained: "Kamera tidak mendukung pengaturan yang diminta. Coba kamera lain atau muat ulang halaman.",
      "insecure-context": "Akses kamera memerlukan HTTPS atau localhost. Pastikan halaman dibuka melalui alamat yang aman.",
      unsupported: "Browser ini tidak mendukung akses kamera. Coba gunakan Chrome atau Safari versi terbaru.",
      aborted: "Permintaan kamera terhenti. Coba jalankan pemindai kembali.",
      security: "Browser memblokir akses kamera. Periksa izin situs dan pengaturan privasi perangkat.",
      "type-error": "Pengaturan kamera tidak valid. Muat ulang halaman dan coba kembali.",
      unknown: "Kamera gagal dijalankan. Periksa izin kamera, lalu coba kembali.",
    } satisfies Record<IScannerError["kind"], string>;
    setCameraError(messages[error.kind]);
  }

  function retryCamera() {
    setCameraError("");
    setCameraAttempt((attempt) => attempt + 1);
  }

  return (
    <section className={styles.scannerPanel} aria-labelledby="attendance-scanner-title">
      <div className={styles.scannerHeading}>
        <span className={styles.scannerIcon}><ScanLine size={17} aria-hidden="true" /></span>
        <div>
          <span className={styles.eyebrow}>PENCATATAN KEHADIRAN</span>
          <h2 id="attendance-scanner-title">Scan QR anggota</h2>
          <p>Gunakan QR resmi dari kartu anggota untuk mencatat kehadiran satu kali.</p>
        </div>
      </div>
      <div className={styles.scannerContent}>
        <div className={styles.cameraFrame}>
          <Scanner
            key={cameraAttempt}
            onScan={(codes) => void handleScan(codes)}
            onError={handleCameraError}
            constraints={cameraConstraints}
            paused={isProcessing}
            scanDelay={800}
          />
          <span className={styles.cameraOverlay} aria-hidden="true" />
        </div>
        <div className={styles.scannerInstructions}>
          <span className={styles.cameraBadge}>
            <Camera size={14} aria-hidden="true" />
            {isProcessing ? "Memproses QR" : "Pemindai QR"}
          </span>
          <h3>Arahkan QR ke dalam bingkai</h3>
          <p>Pastikan layar kartu cukup terang dan kode QR terlihat utuh.</p>
          {isProcessing && <p className={styles.scanPending} role="status">Menyimpan kehadiran...</p>}
          {cameraError && (
            <div className={styles.cameraErrorGroup}>
              <p className={styles.scannerError} role="alert">
                <CircleAlert size={14} aria-hidden="true" />
                {cameraError}
              </p>
              <button
                type="button"
                className={styles.cameraRetryButton}
                onClick={retryCamera}
              >
                Coba buka kamera lagi
              </button>
            </div>
          )}
          {message && (
            <p className={message.isError ? styles.scannerError : styles.scanSuccess} role="status">
              {message.text}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
