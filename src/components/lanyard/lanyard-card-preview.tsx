"use client";

import Image from "next/image";
import { useState, type RefObject } from "react";
import { ArrowLeftRight, BadgeCheck } from "lucide-react";
import { getInitials } from "@/components/members/member-data";
import type { LanyardCardDetails } from "./types";
import styles from "./lanyard-card-preview.module.css";

type LanyardCardPreviewProps = {
  details: LanyardCardDetails;
  photoUrl: string;
  qrDataUrl: string;
  frontFaceRef: RefObject<HTMLElement | null>;
  backFaceRef: RefObject<HTMLElement | null>;
};

function CardLogo({ className }: { className: string }) {
  return (
    <Image
      className={className}
      src="/assets/image/Logo.png"
      alt="Logo UKM Rekayasa Teknologi"
      width={64}
      height={64}
      loading="eager"
      unoptimized
    />
  );
}

function RestexXMark({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 36 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        className={styles.markCross}
        d="M1.5 1C8 3.4 14.7 9 21 13.8L35 23.5C28.2 21.6 21.5 16 15.2 11.2L1.5 1Z"
      />
      <path
        className={styles.markSweep}
        d="M.6 23.3C6.5 18.5 13.5 12.9 20.5 7.6 26.4 3.2 31.8.8 35.7.2 32.3 3.2 27.9 7 22.1 11.8 15.8 17 8.8 22.3 3.1 23.8 2.1 24.1 1.2 23.9.6 23.3Z"
      />
    </svg>
  );
}

export function LanyardCardPreview({
  details,
  photoUrl,
  qrDataUrl,
  frontFaceRef,
  backFaceRef,
}: LanyardCardPreviewProps) {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");

  function showSide(side: "front" | "back") {
    setActiveSide(side);
  }

  return (
    <div className={styles.cardPreview}>
      <div className={styles.hangingAssembly}>
        <svg
          className={styles.lanyardStrap}
          viewBox="0 0 220 176"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="lanyard-fabric" x1="52" y1="8" x2="165" y2="157" gradientUnits="userSpaceOnUse">
              <stop stopColor="#284e69" />
              <stop offset=".48" stopColor="#163852" />
              <stop offset="1" stopColor="#0d2b45" />
            </linearGradient>
          </defs>
          <path
            d="M104 165C91 125 59 91 56 50 53 18 74 5 110 5s57 13 54 45c-3 41-35 75-48 115"
            stroke="#0a263e"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <path
            d="M104 165C91 125 59 91 56 50 53 18 74 5 110 5s57 13 54 45c-3 41-35 75-48 115"
            stroke="url(#lanyard-fabric)"
            strokeWidth="17"
            strokeLinecap="round"
          />
          <path
            d="M104 165C91 125 59 91 56 50 53 18 74 5 110 5s57 13 54 45c-3 41-35 75-48 115"
            stroke="#adc1ce"
            strokeOpacity=".2"
            strokeWidth="1"
            strokeDasharray="2 5"
          />
        </svg>

        <div className={styles.cardHook} aria-hidden="true">
          <span />
        </div>

        <div className={styles.cardPerspective}>
          <div
            className={`${styles.lanyardCard} ${activeSide === "back" ? styles.flipped : ""}`}
            aria-label={`Pratinjau kartu sisi ${activeSide === "front" ? "depan" : "belakang"}`}
          >
            <article
              ref={frontFaceRef}
              className={`${styles.cardFace} ${styles.frontFace}`}
              aria-label="Sisi depan kartu"
            >
              <RestexXMark className={styles.watermarkMark} />
              <header className={styles.frontHeader}>
                <span className={styles.logoPlate}>
                  <CardLogo className={styles.brandLogo} />
                </span>
                <span className={styles.brandName}>
                  <strong aria-label="RESTEX">
                    RESTE
                    <RestexXMark className={styles.brandMark} />
                  </strong>
                  <small>ATTENDANCE</small>
                </span>
                <span className={styles.periodTag}>2026—2027</span>
              </header>

              <div className={styles.portraitWrap}>
                <div className={styles.memberPortrait}>
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={`Foto ${details.name || "anggota"}`}
                      fill
                      unoptimized
                      sizes="104px"
                    />
                  ) : (
                    <span aria-label="Inisial anggota">{getInitials(details.name || "Anggota")}</span>
                  )}
                </div>
                <span className={styles.portraitRing} aria-hidden="true" />
              </div>

              <div className={styles.memberIdentity}>
                <span className={styles.eyebrow}>KARTU IDENTITAS ANGGOTA</span>
                <h3>{details.name || "Nama Anggota"}</h3>
                <p>{details.division || "Divisi RESTEX"}</p>
              </div>

              <div className={styles.memberMeta}>
                <div>
                  <span>NIM</span>
                  <strong>{details.nim || "—"}</strong>
                </div>
                <div>
                  <span>ANGKATAN</span>
                  <strong>{details.cohort || "—"}</strong>
                </div>
              </div>

              <div className={styles.qrSection}>
                <div className={styles.qrFrame}>
                  {qrDataUrl ? (
                    <Image
                      src={qrDataUrl}
                      alt="QR code demo untuk pratinjau kartu"
                      width={70}
                      height={70}
                      unoptimized
                    />
                  ) : (
                    <span className={styles.qrLoading} aria-label="Membuat QR code" />
                  )}
                </div>
                <div className={styles.qrDetails}>
                  <BadgeCheck size={15} aria-hidden="true" />
                  <span>KODE ANGGOTA</span>
                  <small>{details.id}</small>
                </div>
              </div>

              <footer className={styles.frontFooter}>
                <span>UKM REKAYASA TEKNOLOGI</span>
                <span>UNIVERSITAS NUSA PUTRA</span>
              </footer>
            </article>

            <article
              ref={backFaceRef}
              className={`${styles.cardFace} ${styles.backFace}`}
              aria-label="Sisi belakang kartu"
            >
              <div className={styles.backTopRule} aria-hidden="true" />
              <div className={styles.backLogoPlate}>
                <CardLogo className={styles.backLogo} />
              </div>
              <span className={styles.backEyebrow}>UNIT KEGIATAN MAHASISWA</span>
              <h3>REKAYASA<br />TEKNOLOGI</h3>
              <span className={styles.backDivider} aria-hidden="true">
                <span />
              </span>
              <p className={styles.backDescription}>
                Kartu identitas resmi anggota
                <br />
                UKM Rekayasa Teknologi
                <br />
                Universitas Nusa Putra
              </p>
              <div className={styles.backMemberCode}>
                <span>MEMBER ID</span>
                <strong>{details.id}</strong>
              </div>
              <p className={styles.backInstruction}>
                Kartu identitas pribadi anggota RESTEX.
                <br />
                Jika ditemukan, mohon dikembalikan kepada pengurus.
              </p>
              <footer className={styles.backFooter}>
                <span>INOVASI · KOLABORASI · TEKNOLOGI</span>
              </footer>
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
            onClick={() => showSide("front")}
          >
            Depan
          </button>
          <button
            type="button"
            className={activeSide === "back" ? styles.selectedSide : ""}
            aria-pressed={activeSide === "back"}
            onClick={() => showSide("back")}
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
