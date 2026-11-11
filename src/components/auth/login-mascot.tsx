"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import styles from "./login-mascot.module.css";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", onChange);

  return () => mediaQuery.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(reducedMotionQuery).matches;
}

const scenes = [
  {
    id: "hello",
    type: "video",
    src: "/assets/mascot/login-hello.mp4",
    fallback: "/assets/mascot/login-wave.webp",
    duration: 9000,
    label: "01 / SAPAAN",
    title: "Halo, selamat datang!",
    message: "Selamat datang di ruang kerja RESTEX Attendance.",
  },
  {
    id: "scanner",
    type: "image",
    src: "/assets/mascot/login-scanner.webp",
    duration: 7800,
    label: "02 / ABSENSI QR",
    title: "Siap untuk check-in?",
    message: "Arahkan scanner ke QR kegiatan untuk mencatat kehadiranmu.",
  },
  {
    id: "lanyard",
    type: "video",
    src: "/assets/mascot/login-lanyard-card.mp4",
    fallback: "/assets/mascot/login-lanyard.webp",
    duration: 9000,
    label: "03 / KARTU LANYARD",
    title: "Kenali timnya.",
    message: "Lanyard membantu mengenali pengurus yang siap menyambutmu.",
  },
] as const;

type VideoSceneId = Extract<(typeof scenes)[number], { type: "video" }>["id"];

export function LoginMascot() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [failedVideos, setFailedVideos] = useState<VideoSceneId[]>([]);
  const [readyVideo, setReadyVideo] = useState<VideoSceneId | null>(null);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    () => false,
  );
  const scene = scenes[activeScene];

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const timeout = window.setTimeout(
      () => setActiveScene((current) => (current + 1) % scenes.length),
      scene.duration,
    );

    return () => window.clearTimeout(timeout);
  }, [activeScene, prefersReducedMotion, scene.duration]);

  useEffect(() => {
    const video = videoRef.current;

    if (
      scene.type !== "video" ||
      prefersReducedMotion ||
      failedVideos.includes(scene.id)
    ) {
      video?.pause();
      return;
    }

    if (!video) {
      return;
    }

    let isCurrent = true;

    void video.play().then(
      () => {
        if (isCurrent) {
          setReadyVideo(scene.id);
        }
      },
      () => {
        if (isCurrent) {
          setFailedVideos((current) =>
            current.includes(scene.id) ? current : [...current, scene.id],
          );
        }
      },
    );

    return () => {
      isCurrent = false;
      video.pause();
    };
  }, [activeScene, failedVideos, prefersReducedMotion, scene]);

  return (
    <div
      className={`${styles.stage} ${styles[scene.id]}`}
      role="img"
      aria-label={`${scene.title} ${scene.message}`}
      aria-live="off"
    >
      <div className={styles.orbit} aria-hidden="true" />
      {scenes.map((item, index) => {
        const imageSrc =
          item.type === "video" ? item.fallback : item.src;
        const isCurrent = index === activeScene;
        const isVisible =
          isCurrent &&
          (item.type !== "video" ||
            prefersReducedMotion ||
            failedVideos.includes(item.id) ||
            readyVideo !== item.id);

        return (
          <div
            key={item.id}
            className={`${styles.mascot} ${styles[`${item.id}Media`]} ${
              isVisible ? styles.active : ""
            }`}
            aria-hidden="true"
          >
            <Image
              src={imageSrc}
              alt=""
              width={640}
              height={640}
              sizes="(max-width: 900px) 160px, 220px"
              loading="eager"
              unoptimized
              onError={
                item.type === "video"
                  ? () =>
                      setFailedVideos((current) =>
                        current.includes(item.id)
                          ? current
                          : [...current, item.id],
                      )
                  : undefined
              }
            />
          </div>
        );
      })}
      {scene.type === "video" && (
        <div
          className={`${styles.mascot} ${styles.animationMedia} ${
            styles[`${scene.id}Media`]
          } ${!prefersReducedMotion && !failedVideos.includes(scene.id) && readyVideo === scene.id ? styles.active : ""}`}
          aria-hidden="true"
        >
          <video
            key={`video-${scene.id}`}
            ref={videoRef}
            className={styles.animationVideo}
            src={scene.src}
            muted
            playsInline
            preload="none"
            tabIndex={-1}
            onError={() => {
              setFailedVideos((current) =>
                current.includes(scene.id) ? current : [...current, scene.id],
              );
            }}
          />
        </div>
      )}
      <div className={styles.dialogue} key={scene.id} aria-hidden="true">
        <span className={styles.dialogueLabel}>{scene.label}</span>
        <strong>{scene.title}</strong>
        <p>{scene.message}</p>
      </div>
    </div>
  );
}
