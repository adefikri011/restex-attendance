"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeftRight } from "lucide-react";
import type { LanyardCardDetails } from "./types";
import styles from "./lanyard-card-preview.module.css";

type LanyardCardPreviewProps = {
  details: LanyardCardDetails;
  frontImage: string;
  backImage: string;
};

export function LanyardCardPreview({
  details,
  frontImage,
  backImage,
}: LanyardCardPreviewProps) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [swingAngle, setSwingAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swingAngleRef = useRef(0);
  const swingVelocity = useRef(0);
  const pointerStart = useRef<{
    pointerId: number;
    x: number;
    angle: number;
    moved: boolean;
  } | null>(null);
  const springFrame = useRef<number | null>(null);

  function updateSwingAngle(angle: number) {
    swingAngleRef.current = angle;
    setSwingAngle(angle);
  }

  function animateSwing() {
    if (springFrame.current !== null) {
      cancelAnimationFrame(springFrame.current);
    }

    let previousTime: number | null = null;
    const animate = (time: number) => {
      const step = previousTime === null ? 1 : Math.min((time - previousTime) / 16.67, 2.5);
      previousTime = time;

      const angle = swingAngleRef.current;
      swingVelocity.current = (swingVelocity.current - angle * 0.015 * step) * Math.pow(0.985, step);
      const nextAngle = angle + swingVelocity.current * step;

      if (Math.abs(nextAngle) < 0.08 && Math.abs(swingVelocity.current) < 0.08) {
        updateSwingAngle(0);
        swingVelocity.current = 0;
        springFrame.current = null;
        return;
      }

      updateSwingAngle(Math.max(-18, Math.min(18, nextAngle)));
      springFrame.current = requestAnimationFrame(animate);
    };

    springFrame.current = requestAnimationFrame(animate);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;

    if (springFrame.current !== null) {
      cancelAnimationFrame(springFrame.current);
      springFrame.current = null;
    }

    pointerStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      angle: swingAngleRef.current,
      moved: false,
    };
    swingVelocity.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    event.preventDefault();
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    if (Math.abs(deltaX) > 5) start.moved = true;
    updateSwingAngle(Math.max(-14, Math.min(14, start.angle + deltaX * 0.1)));
  }

  function releaseSwing(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    pointerStart.current = null;
    setIsDragging(false);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      updateSwingAngle(0);
      swingVelocity.current = 0;
      return;
    }

    if (start.moved) {
      swingVelocity.current += Math.max(-2, Math.min(2, (swingAngleRef.current - start.angle) * 0.12));
    } else {
      const bounds = event.currentTarget.getBoundingClientRect();
      const direction = event.clientX < bounds.left + bounds.width * 0.58 ? -1 : 1;
      swingVelocity.current += direction * 1.8;
    }
    animateSwing();
  }

  useEffect(() => {
    return () => {
      if (springFrame.current !== null) {
        cancelAnimationFrame(springFrame.current);
      }
    };
  }, []);

  const strapX = swingAngle * 1.1;
  const strapShape = `M35 -12 C${45 + strapX * 0.12} 42 ${45 + strapX * 0.55} 112 ${30 + strapX} 190 L${190 + strapX} 190 C${175 + strapX * 0.55} 112 ${175 + strapX * 0.12} 42 185 -12 Z`;

  return (
    <div className={styles.cardPreview}>
      <div className={styles.artworkFrame}>
        <div
          className={`${styles.lanyardAssembly} ${isDragging ? styles.dragging : ""}`}
          style={{ transform: `rotate(${swingAngle}deg)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={releaseSwing}
          onPointerCancel={releaseSwing}
        >
          <svg
            className={styles.lanyardStrap}
            viewBox="0 0 220 180"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="lanyard-fabric" x1="0" x2="1" y1="0" y2=".15">
                <stop offset="0" stopColor="#c9c8c2" />
                <stop offset=".22" stopColor="#f0efea" />
                <stop offset=".52" stopColor="#d8d6d0" />
                <stop offset=".8" stopColor="#efeee9" />
                <stop offset="1" stopColor="#c4c3bd" />
              </linearGradient>
              <pattern
                id="lanyard-weave"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
              >
                <path d="M2 0v8M6 0v8" stroke="#fff" strokeOpacity=".2" strokeWidth=".7" />
                <path d="M0 3h8M0 7h8" stroke="#6d6e6c" strokeOpacity=".08" strokeWidth=".6" />
              </pattern>
              <path id="lanyard-shape" d={strapShape} />
            </defs>
            <use href="#lanyard-shape" fill="#102b40" fillOpacity=".15" transform="translate(2 3)" />
            <use href="#lanyard-shape" fill="url(#lanyard-fabric)" />
            <use href="#lanyard-shape" fill="url(#lanyard-weave)" />
            <path
              d={`M48 -4 C${57 + strapX * 0.15} 48 ${56 + strapX * 0.55} 116 ${48 + strapX} 177`}
              fill="none"
              stroke="#fff"
              strokeOpacity=".3"
              strokeWidth="2"
            />
          </svg>
          <div
            className={styles.artworkCard}
            aria-label={`Pratinjau kartu sisi ${activeSide === "front" ? "depan" : "belakang"}`}
            style={{ transform: `rotateY(${activeSide === "back" ? 180 : -5}deg)` }}
          >
            <article
              className={`${styles.cardFace} ${styles.frontFace}`}
              aria-label="Sisi depan kartu"
            >
              {frontImage ? (
                <Image
                  className={styles.artworkImage}
                  src={frontImage}
                  alt={`Kartu depan ${details.name || "anggota"} dengan ID ${details.id}`}
                  fill
                  sizes="(max-width: 700px) 280px, 340px"
                  priority
                  unoptimized
                />
              ) : (
                <span className={styles.cardLoading}>Menyiapkan kartu...</span>
              )}
            </article>

            <article
              className={`${styles.cardFace} ${styles.backFace}`}
              aria-label="Sisi belakang kartu"
            >
              {backImage ? (
                <Image
                  className={styles.artworkImage}
                  src={backImage}
                  alt={`Kartu belakang dengan ID ${details.id}`}
                  fill
                  sizes="(max-width: 700px) 280px, 340px"
                  unoptimized
                />
              ) : (
                <span className={styles.cardLoading}>Menyiapkan kartu...</span>
              )}
            </article>
          </div>
        </div>
      </div>

      <div className={styles.sideSelector}>
        <span className={styles.sideSelectorLabel}>SISI KARTU</span>
        <div className={styles.sideControls} role="group" aria-label="Pilih sisi kartu">
          <button
            type="button"
            className={activeSide === "front" ? styles.selectedSide : ""}
            aria-pressed={activeSide === "front"}
            onClick={() => setActiveSide("front")}
          >
            Depan
          </button>
          <button
            type="button"
            className={activeSide === "back" ? styles.selectedSide : ""}
            aria-pressed={activeSide === "back"}
            onClick={() => setActiveSide("back")}
          >
            Belakang
          </button>
          <span className={styles.sideHint}>
            <ArrowLeftRight size={13} aria-hidden="true" />
            Putar kartu
          </span>
        </div>
        <span className={styles.dragHint}>Klik atau seret kartu untuk mengayunkannya</span>
      </div>
    </div>
  );
}
