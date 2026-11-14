"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ACTIVE_PERIOD } from "@/data/active-period";
import type {
  RecruitmentSettings,
  RecruitmentStatus,
} from "@/lib/recruitment";
import { formatTanggal } from "@/lib/recruitment";
import styles from "./landing-hero.module.css";

const HERO_TITLE = "Membangun teknologi, bukan cuma mempelajarinya.";
const HERO_SUPPORTING_TEXT = "Riset, inovasi, dan kerja bersama.";
const ACTIVE_PERIOD_LABEL = `Periode ${ACTIVE_PERIOD.label}`;
const ABOUT_SECTION_HREF = "#tentang";
// QR can point to /pendaftaran once member registration opens.
const QR_TARGET = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "/";

const copy = {
  cardOrganization: "UKM Rekayasa Teknologi",
  cardUniversity: "Universitas Nusa Putra",
  qrCaption: "Pindai untuk berkunjung",
  cardName: "Nama: kamu?",
  notifyShort: "Kabari saya",
  notifyArrow: "Kabari saya →",
  registrationUpcoming: "Oprec belum dibuka.",
  registrationClosed: "Oprec periode ini sudah ditutup.",
  registrationOpen: "Pendaftaran dibuka.",
  register: "Daftar sekarang",
  activities: "Lihat kegiatan",
  notify: "Kabari saya saat oprec dibuka",
  notifyUnavailable: "Kanal pemberitahuan belum tersedia.",
  about: "Tentang RESTEX",
  deadline: "Ditutup",
  flipToBack: "Balik kartu anggota RESTEX untuk melihat sisi belakang",
  flipToFront: "Balik kartu anggota RESTEX ke sisi depan",
  qrAlt: "Kode QR untuk mengunjungi situs RESTEX",
  qrError: "Kode QR tidak dapat dibuat.",
};

function isInternalRecruitmentUrl(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function isExternalRecruitmentUrl(href: string) {
  return /^https:\/\//i.test(href);
}

function RecruitmentLink({
  href,
  className,
  children,
  tabIndex,
  isHidden = false,
}: {
  href: string;
  className: string;
  children: ReactNode;
  tabIndex?: number;
  isHidden?: boolean;
}) {
  const visibilityProps = {
    tabIndex,
    "aria-hidden": isHidden,
    inert: isHidden,
  };

  if (isInternalRecruitmentUrl(href)) {
    return (
      <Link className={className} href={href} {...visibilityProps}>
        {children}
      </Link>
    );
  }

  if (isExternalRecruitmentUrl(href)) {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...visibilityProps}
      >
        {children}
      </a>
    );
  }

  return null;
}

function getRegistrationLabel(status: RecruitmentStatus) {
  if (status.state === "open") return copy.registrationOpen;
  if (status.state === "upcoming") return copy.registrationUpcoming;
  return copy.registrationClosed;
}

function Lanyard() {
  return (
    <svg
      className={styles.lanyard}
      viewBox="0 0 120 240"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M34 -4C34 55 42 86 55 111M86 -4C86 55 78 86 65 111"
        stroke="#0B2F4A"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="49" y="100" width="22" height="31" rx="4" fill="#778995" />
      <rect x="53" y="104" width="14" height="22" rx="2" fill="#E5EBEF" />
      <path
        d="M60 131V145C60 151 60 153 60 160V169"
        stroke="#0B2F4A"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M55 161H65V170H55" stroke="#778995" strokeWidth="3" />
    </svg>
  );
}

export function LandingHero({
  recruitmentStatus,
  recruitmentSettings,
}: {
  recruitmentStatus: RecruitmentStatus;
  recruitmentSettings: RecruitmentSettings;
}) {
  const peekRef = useRef<HTMLImageElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasSettled, setHasSettled] = useState(false);
  const [peekState, setPeekState] = useState<
    "ssr" | "waiting" | "shown"
  >("ssr");
  const [peekAvailable, setPeekAvailable] = useState(true);
  const [qrSource, setQrSource] = useState<string | null>(null);
  const [qrFailed, setQrFailed] = useState(false);
  const registerUrl = recruitmentSettings.registerUrl.trim();
  const notifyUrl = recruitmentSettings.notifyUrl.trim();
  const hasRegisterUrl =
    isInternalRecruitmentUrl(registerUrl) ||
    isExternalRecruitmentUrl(registerUrl);
  const hasNotifyUrl =
    isInternalRecruitmentUrl(notifyUrl) ||
    isExternalRecruitmentUrl(notifyUrl);

  useEffect(() => {
    const peek = peekRef.current;
    if (!peek) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPeekState("shown");
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    const frame = window.requestAnimationFrame(() => {
      setPeekState("waiting");
      observer.observe(peek);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let active = true;

    QRCode.toString(QR_TARGET, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 0,
      width: 104,
      color: {
        dark: "#08263D",
        light: "#FFFFFF",
      },
    })
      .then((svg) => {
        if (active) {
          setQrSource(
            `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
          );
        }
      })
      .catch((error: unknown) => {
        console.error("Hero card QR generation failed.", error);
        if (active) setQrFailed(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
      <div className={`${styles.layout} site-container`}>
        <div className={styles.copy}>
          <p className={styles.period}>
            <span className={styles.periodDot} aria-hidden="true" />
            {ACTIVE_PERIOD_LABEL}
          </p>

          <h1 className={styles.title} id="landing-hero-title">
            {HERO_TITLE}
          </h1>

          <p className={styles.supportingText}>{HERO_SUPPORTING_TEXT}</p>

          <div className={styles.actions}>
            {recruitmentStatus.state === "open" && hasRegisterUrl ? (
              <RecruitmentLink
                className={styles.primaryAction}
                href={
                  isInternalRecruitmentUrl(registerUrl)
                    ? "/pendaftaran"
                    : registerUrl
                }
              >
                {copy.register}
              </RecruitmentLink>
            ) : recruitmentStatus.state === "open" ? (
              <span
                className={styles.primaryAction}
                aria-disabled="true"
                title={copy.notifyUnavailable}
              >
                {copy.register}
              </span>
            ) : (
              <Link className={styles.primaryAction} href={ABOUT_SECTION_HREF}>
                {copy.activities}
              </Link>
            )}
            {recruitmentStatus.state === "open" &&
              recruitmentStatus.closesAt && (
                <span className={styles.deadline}>
                  {copy.deadline}{" "}
                  <time dateTime={recruitmentStatus.closesAt}>
                    {formatTanggal(recruitmentStatus.closesAt)}
                  </time>
                </span>
              )}
            {recruitmentStatus.state !== "open" &&
              (hasNotifyUrl ? (
                <RecruitmentLink
                  className={styles.textAction}
                  href={notifyUrl}
                >
                  {copy.notify}
                  {isExternalRecruitmentUrl(notifyUrl) && (
                    <span className="sr-only">(membuka tab baru)</span>
                  )}
                </RecruitmentLink>
              ) : (
                <span
                  className={styles.unavailableAction}
                  aria-disabled="true"
                  title={copy.notifyUnavailable}
                >
                  {copy.notify}
                </span>
              ))}
            {recruitmentStatus.state === "open" && (
              <Link className={styles.textAction} href={ABOUT_SECTION_HREF}>
                {copy.about}
              </Link>
            )}
          </div>
        </div>

        <div className={styles.cardStage}>
          <div
            className={`${styles.swingAssembly} ${
              hasSettled ? styles.settled : ""
            }`}
            onAnimationEnd={() => setHasSettled(true)}
          >
            <Lanyard />
            <div className={styles.cardPosition}>
              <div
                className={`${styles.flipArea} ${
                  isFlipped ? styles.flipped : ""
                }`}
              >
                <button
                  className={styles.cardButton}
                  type="button"
                  aria-label={
                    isFlipped ? copy.flipToFront : copy.flipToBack
                  }
                  aria-pressed={isFlipped}
                  onClick={() => setIsFlipped((flipped) => !flipped)}
                >
                  <span className={styles.cardShell}>
                    <span
                      className={`${styles.cardFace} ${styles.cardFront}`}
                      aria-hidden={isFlipped}
                      inert={isFlipped}
                    >
                      <span className={styles.cardHole} aria-hidden="true" />
                      <span className={styles.redStrip} />
                      <span className={styles.cardIdentity}>
                        <strong>RESTEX</strong>
                        <span>{copy.cardOrganization}</span>
                        <span>{copy.cardUniversity}</span>
                      </span>
                      <span className={styles.photoSlot} aria-hidden="true">
                        <span className={styles.cardMascot} />
                      </span>
                      <span className={styles.cardName}>{copy.cardName}</span>
                      <span className={styles.cardFooter}>
                        {qrSource ? (
                          <Image
                            className={styles.qrCode}
                            src={qrSource}
                            alt={copy.qrAlt}
                            width={104}
                            height={104}
                            unoptimized
                          />
                        ) : (
                          <span
                            className={styles.qrPlaceholder}
                            role={qrFailed ? "img" : "status"}
                            aria-label={qrFailed ? copy.qrError : undefined}
                          >
                            {qrFailed ? copy.qrError : ""}
                          </span>
                        )}
                        <span className={styles.qrCaption}>
                          {copy.qrCaption}
                        </span>
                      </span>
                    </span>

                    <span
                      className={`${styles.cardFace} ${styles.cardBack}`}
                      aria-hidden={!isFlipped}
                      inert={!isFlipped}
                    >
                      <span className={styles.redStrip} aria-hidden="true" />
                      <span className={styles.backLogoHeader}>
                        <Image
                          className={styles.backLogo}
                          src="/assets/image/logoNavbar.png"
                          alt="Logo RESTEX"
                          width={56}
                          height={56}
                        />
                        <span className={styles.logoDivider} aria-hidden="true" />
                        <Image
                          className={styles.universityLogo}
                          src="/assets/image/nusaputra_logo.png"
                          alt="Logo Universitas Nusa Putra"
                          width={56}
                          height={56}
                        />
                      </span>
                      <span className={styles.backTagline}>
                        <span>Learn.</span>
                        <span>Connect.</span>
                        <span>Innovate.</span>
                      </span>
                      <span className={styles.backSpacer} aria-hidden="true" />
                      <span className={styles.backIdentity}>
                        <span>{copy.cardOrganization}</span>
                        <span>{copy.cardUniversity}</span>
                      </span>
                      <span
                        className={styles.backActionSpace}
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                </button>
                {recruitmentStatus.state === "open" && hasRegisterUrl ? (
                  <RecruitmentLink
                    className={styles.joinAction}
                    href={registerUrl}
                    tabIndex={isFlipped ? 0 : -1}
                    isHidden={!isFlipped}
                  >
                    {copy.register}
                  </RecruitmentLink>
                ) : (
                  <div
                    className={styles.notifyAction}
                    aria-hidden={!isFlipped}
                    inert={!isFlipped}
                  >
                    <span className={styles.registrationStatus}>
                      {getRegistrationLabel(recruitmentStatus)}
                    </span>
                    {recruitmentStatus.state === "open" ? (
                      <span
                        className={styles.notifyUnavailable}
                        aria-disabled="true"
                        title={copy.notifyUnavailable}
                      >
                        {copy.register}
                      </span>
                    ) : hasNotifyUrl ? (
                      <a
                        className={styles.notifyLink}
                        href={notifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={isFlipped ? 0 : -1}
                      >
                        {copy.notifyArrow}
                        <span className="sr-only">(membuka tab baru)</span>
                      </a>
                    ) : (
                      <span
                        className={styles.notifyUnavailable}
                        aria-disabled="true"
                        title={copy.notifyUnavailable}
                      >
                        {copy.notifyArrow}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {peekAvailable && (
        <div className={styles.peekAnchor} aria-hidden="true">
          <Image
            ref={peekRef}
            className={`${styles.peek} ${
              peekState === "waiting"
                ? styles.peekWaiting
                : peekState === "shown"
                  ? styles.peekShown
                  : ""
            }`}
            src="/assets/mascot/peek.webp"
            alt=""
            aria-hidden="true"
            width={813}
            height={703}
            loading="lazy"
            sizes="(max-width: 767px) 110px, (max-width: 999px) 130px, (max-width: 1384px) 13vw, 180px"
            draggable={false}
            onError={() => setPeekAvailable(false)}
          />
        </div>
      )}
    </section>
  );
}
