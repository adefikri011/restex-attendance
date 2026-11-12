"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./page-loading.module.css";

type PageLoadingProps = {
  title?: string;
  description?: string;
};

export function PageLoading({
  title = "Menyiapkan ruang kerja",
  description = "Mengambil data dan menyiapkan tampilan Anda.",
}: PageLoadingProps) {
  const mascotVideoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () =>
      setPrefersReducedMotion(motionPreference.matches);

    updateMotionPreference();
    motionPreference.addEventListener("change", updateMotionPreference);
    return () =>
      motionPreference.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const video = mascotVideoRef.current;
    if (!video || prefersReducedMotion || videoFailed) return;

    let isCurrent = true;

    void video.play().catch((error: unknown) => {
      if (!isCurrent) return;
      console.error("Page loading mascot video could not be played.", error);
      setVideoFailed(true);
    });

    return () => {
      isCurrent = false;
      video.pause();
    };
  }, [prefersReducedMotion, videoFailed]);

  return (
    <main className={styles.screen}>
      <div
        className={styles.content}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className={styles.mascotStage} aria-hidden="true">
          <div className={styles.mascotArtwork}>
            {prefersReducedMotion || videoFailed ? (
              <Image
                className={styles.mascot}
                src="/assets/mascot/loading.png"
                alt=""
                width={720}
                height={720}
                priority
                unoptimized
              />
            ) : (
              <video
                ref={mascotVideoRef}
                className={styles.mascot}
                src="/assets/mascot/loading.webm"
                poster="/assets/mascot/loading.png"
                muted
                loop
                playsInline
                preload="metadata"
                onError={() => {
                  console.error("Page loading mascot video failed to load.");
                  setVideoFailed(true);
                }}
              />
            )}
          </div>
        </div>

        <div className={styles.message}>
          <span className={styles.eyebrow}>
            <span className={styles.statusDot} />
            RESTEX <span className={styles.divider}>/</span> SEDANG MEMUAT
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </main>
  );
}
