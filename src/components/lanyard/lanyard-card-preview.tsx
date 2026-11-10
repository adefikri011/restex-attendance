"use client";

import Image from "next/image";
import { useState } from "react";
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

  return (
    <div className={styles.cardPreview}>
      <div className={styles.artworkFrame}>
        <div
          className={`${styles.artworkCard} ${activeSide === "back" ? styles.flipped : ""}`}
          aria-label={`Pratinjau kartu sisi ${activeSide === "front" ? "depan" : "belakang"}`}
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
      </div>
    </div>
  );
}
