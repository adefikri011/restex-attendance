"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LANDING_NAVIGATION_ITEMS } from "./landing-navigation";
import styles from "./landing-footer.module.css";

const SOCIAL_LINKS: { label: string; href: string }[] = [
  // TODO: Add verified RESTEX social profile URLs.
];

const CONTACT_EMAIL = ""; // TODO: Add the official RESTEX contact email.
const COPYRIGHT_YEAR = new Date().getFullYear();

export function LandingFooter() {
  const footerRef = useRef<HTMLElement>(null);
  const mascotRef = useRef<HTMLDivElement>(null);
  const [mascotState, setMascotState] = useState<
    "visible" | "waiting" | "shown"
  >("visible");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mascot = mascotRef.current;
    if (!mascot || !("IntersectionObserver" in window)) return;

    let observer: IntersectionObserver | null = null;
    const frame = window.requestAnimationFrame(() => {
      setMascotState("waiting");
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setMascotState("shown");
            observer?.disconnect();
          }
        },
        { threshold: 0.3 },
      );
      observer.observe(mascot);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  const enabledNavigationItems = LANDING_NAVIGATION_ITEMS.filter(
    (item) => item.enabled,
  );
  const enabledSocialLinks = SOCIAL_LINKS.filter((item) => item.href.trim());

  const handleBackToTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  return (
    <footer
      className={styles.footer}
      ref={footerRef}
      data-mascot={mascotState}
    >
      <div className={styles.gridField} aria-hidden="true" />
      <div className={`${styles.container} site-container`}>
        <div className={styles.main}>
          <div className={styles.identity}>
            <div className={styles.logoPill}>
              <Image
                src="/assets/image/logoNavbar.png"
                alt="RESTEX"
                width={40}
                height={40}
                sizes="36px"
              />
            </div>
            <p className={styles.organization}>
              <span>UKM Rekayasa Teknologi</span>
              <span>Universitas Nusa Putra</span>
            </p>
            <p className={styles.tagline}>
              Riset, inovasi, dan kerja bersama.
            </p>
          </div>

          <div className={styles.mascotSlot} aria-hidden="true" />

          <nav className={styles.footerNavigation} aria-label="Navigasi footer">
            <div className={styles.linkGroup}>
              <h2 className={styles.groupTitle}>Jelajahi</h2>
              <ul className={styles.linkList}>
                {enabledNavigationItems.map((item) => {
                  const href = item.href.startsWith("#")
                    ? `/${item.href}`
                    : item.href;
                  return (
                    <li key={item.href}>
                      <Link className={styles.footerLink} href={href}>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {enabledSocialLinks.length > 0 && (
              <div className={styles.linkGroup}>
                <h2 className={styles.groupTitle}>Ikuti</h2>
                <ul className={styles.linkList}>
                  {enabledSocialLinks.map((item) => (
                    <li key={item.label}>
                      <a
                        className={styles.footerLink}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${item.label} (tautan eksternal)`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {CONTACT_EMAIL.trim() && (
              <a
                className={styles.contactLink}
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
            )}
          </nav>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {COPYRIGHT_YEAR} RESTEX · UKM Rekayasa Teknologi, Universitas
            Nusa Putra
          </p>
          <span className={styles.bottomSpacer} aria-hidden="true" />
          <nav className={styles.bottomLinks} aria-label="Tautan penutup">
            <a
              className={styles.bottomLink}
              href="#top"
              onClick={handleBackToTop}
              aria-label="Kembali ke bagian atas halaman"
            >
              Kembali ke atas ↑
            </a>
            <a
              className={styles.bottomLink}
              href="https://nusaputra.ac.id/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Bagian dari Universitas Nusa Putra (tautan eksternal)"
            >
              Bagian dari Universitas Nusa Putra
            </a>
          </nav>
        </div>

        <div className={styles.mascotReserve} aria-hidden="true" />
      </div>

      <div className={styles.mascot} aria-hidden="true" ref={mascotRef}>
        <Image
          src="/assets/mascot/footer.webp"
          alt=""
          aria-hidden="true"
          draggable={false}
          width={756}
          height={890}
          loading="lazy"
          sizes="(max-width: 1023px) clamp(200px, 56vw, 260px), clamp(240px, 24vw, 340px)"
        />
      </div>
    </footer>
  );
}
