"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Camera, CircleAlert, ScanLine } from "lucide-react";
import type { IDetectedBarcode, IScannerError } from "@yudiel/react-qr-scanner";
import styles from "./login-qr-scanner.module.css";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((module) => module.Scanner),
  {
    ssr: false,
    loading: () => <div className={styles.cameraLoading}>Menyiapkan kamera...</div>,
  },
);

type LoginQrAccount = { email: string; name: string };

type LoginQrScannerProps = {
  onAccountIdentified: (account: LoginQrAccount) => void;
};

function isLoginQrAccount(value: unknown): value is LoginQrAccount {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    typeof value.email === "string" &&
    "name" in value &&
    typeof value.name === "string"
  );
}

export function LoginQrScanner({
  onAccountIdentified,
}: LoginQrScannerProps) {
  const [message, setMessage] = useState("");
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
  const lastScanned = useRef<{ token: string; at: number } | null>(null);

  async function handleScan(codes: IDetectedBarcode[]) {
    const token = codes.find((code) => code.rawValue)?.rawValue;
    if (!token || inFlight.current) return;
    if (
      lastScanned.current?.token === token &&
      Date.now() - lastScanned.current.at < 5000
    ) {
      return;
    }

    lastScanned.current = { token, at: Date.now() };
    inFlight.current = true;
    setIsProcessing(true);
    setCameraError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/qr-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result: unknown = await response.json();
      if (!response.ok || !isLoginQrAccount(result)) {
        const errorMessage =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "QR tidak dapat diverifikasi. Coba pindai kembali.";
        setMessage(errorMessage);
        return;
      }

      onAccountIdentified(result);
    } catch {
      setMessage("Layanan verifikasi QR tidak dapat dihubungi.");
    } finally {
      inFlight.current = false;
      setIsProcessing(false);
    }
  }

  function handleCameraError(error: IScannerError) {
    if (error.kind === "overconstrained" && cameraConstraints.facingMode) {
      setCameraConstraints({ width: { ideal: 640 }, height: { ideal: 480 } });
      setCameraError("");
      setCameraAttempt((attempt) => attempt + 1);
      return;
    }

    const messages = {
      "permission-denied": "Izinkan akses kamera untuk memindai kartu.",
      "no-camera": "Kamera tidak ditemukan pada perangkat ini.",
      "in-use": "Kamera sedang digunakan aplikasi atau tab lain.",
      overconstrained: "Kamera tidak mendukung pengaturan yang diminta.",
      "insecure-context": "Akses kamera memerlukan HTTPS atau localhost.",
      unsupported: "Browser ini tidak mendukung pemindai QR.",
      aborted: "Pemindaian terhenti. Silakan coba kembali.",
      security: "Browser memblokir akses kamera. Periksa izin situs.",
      "type-error": "Pengaturan kamera tidak valid.",
      unknown: "Kamera gagal dijalankan. Periksa izin kamera.",
    } satisfies Record<IScannerError["kind"], string>;
    setCameraError(messages[error.kind]);
  }

  return (
    <div className={styles.scanner}>
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
      <div className={styles.instructions}>
        <span className={styles.cameraBadge}>
          <Camera size={13} aria-hidden="true" />
          {isProcessing ? "Memeriksa kartu..." : "Pemindai QR"}
        </span>
        <p><ScanLine size={14} aria-hidden="true" /> Arahkan QR lanyard ke dalam bingkai.</p>
        <small>QR hanya mengenali akun. Kata sandi dan verifikasi keamanan tetap diperlukan.</small>
        {cameraError && (
          <span className={styles.error} role="alert">
            <CircleAlert size={14} aria-hidden="true" />
            {cameraError}
          </span>
        )}
        {message && <span className={styles.error} role="status">{message}</span>}
      </div>
    </div>
  );
}
