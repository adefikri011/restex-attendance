"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./floating-mascot.module.css";

export function FloatingMascot() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const video = videoRef.current;
    let isActive = true;

    function syncPlayback(video: HTMLVideoElement) {
      if (motionPreference.matches) {
        video.pause();
        setIsPlaying(false);
        return;
      }

      void video.play().then(
        () => {
          if (isActive && !motionPreference.matches) {
            setIsPlaying(true);
          }
        },
        () => {
          if (isActive) {
            setIsPlaying(false);
          }
        },
      );
    }

    function handleMotionPreferenceChange() {
      const currentVideo = videoRef.current;

      if (currentVideo) {
        syncPlayback(currentVideo);
      }
    }

    if (!video) {
      return;
    }

    motionPreference.addEventListener("change", handleMotionPreferenceChange);
    syncPlayback(video);

    return () => {
      isActive = false;
      motionPreference.removeEventListener("change", handleMotionPreferenceChange);
      video.pause();
    };
  }, []);

  if (pathname === "/login") {
    return null;
  }

  return (
    <div className={styles.mascotDock} aria-hidden="true">
      <video
        ref={videoRef}
        className={`${styles.mascotVideo} ${isPlaying ? styles.playing : ""}`}
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
      >
        <source
          src="/assets/mascot/bengong.webm"
          type="video/webm"
        />
      </video>
      <Image
        className={`${styles.mascotFallback} ${isPlaying ? styles.hidden : ""}`}
        src="/assets/mascot/login-wave.webp"
        alt=""
        width={720}
        height={720}
        loading="eager"
        unoptimized
      />
    </div>
  );
}
