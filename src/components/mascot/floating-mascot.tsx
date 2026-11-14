"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, X } from "lucide-react";
import styles from "./floating-mascot.module.css";

const APPEARANCE_INTERVAL = 3 * 60_000;
const DISPLAY_DURATION = 16_000;

const poses = [
  {
    src: "/assets/mascot/floating-guide.webp",
    message: "Butuh bantuan? Aku tunjukkan bagian yang kamu perlukan.",
  },
  {
    src: "/assets/mascot/floating-scan.webp",
    message: "Siap hadir? Pindai QR kegiatan untuk mencatat kehadiranmu.",
  },
  {
    src: "/assets/mascot/floating-lanyard.webp",
    message: "Jangan lupa kenakan lanyard saat bertugas, ya.",
  },
  {
    src: "/assets/mascot/floating-done.webp",
    message: "Terima kasih sudah menjaga kegiatan RESTEX tetap tertib!",
  },
] as const;

export function FloatingMascot() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [poseIndex, setPoseIndex] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [phase, setPhase] = useState<"display" | "interval">("display");
  const pose = poses[poseIndex];
  const isCandidatePortal = pathname === "/portal/calon-anggota";
  const isRegistrationPage = pathname === "/pendaftaran";
  const isLoginPage = pathname === "/login";
  const isLandingPage = pathname === "/";

  useEffect(() => {
    if (isLoginPage || isLandingPage || isRegistrationPage || isCandidatePortal) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (phase === "display") {
        setIsVisible(false);
        setPhase("interval");
      } else {
        setPoseIndex((current) => (current + 1) % poses.length);
        setIsVisible(true);
        setIsHidden(false);
        setPhase("display");
      }
    }, phase === "display" ? DISPLAY_DURATION : APPEARANCE_INTERVAL);

    return () => window.clearTimeout(timeout);
  }, [isCandidatePortal, isLandingPage, isLoginPage, isRegistrationPage, phase]);

  function hideMascot() {
    setIsVisible(false);
    setIsHidden(true);
  }

  function showMascot() {
    setIsVisible(true);
    setIsHidden(false);
    setPhase("display");
  }

  if (isLoginPage || isLandingPage || isRegistrationPage || isCandidatePortal) {
    return null;
  }

  return (
    <aside
      className={`${styles.mascotDock} ${isVisible && !isHidden ? styles.visible : ""}`}
      aria-label="Maskot RESTEX Attendance"
    >
      {isHidden || !isVisible ? (
        <button
          type="button"
          className={styles.restoreButton}
          aria-label="Tampilkan maskot"
          title="Tampilkan maskot"
          onClick={showMascot}
        >
          <Bot size={19} aria-hidden="true" />
        </button>
      ) : (
        <>
          <div className={styles.speechBubble} role="status" aria-live="polite">
            <p key={pose.src}>{pose.message}</p>
          </div>
          <Image
            key={pose.src}
            className={styles.mascotImage}
            src={pose.src}
            alt=""
            width={320}
            height={320}
            unoptimized
          />
          <button
            type="button"
            className={styles.hideButton}
            aria-label="Sembunyikan maskot"
            title="Sembunyikan maskot"
            onClick={hideMascot}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </>
      )}
    </aside>
  );
}
