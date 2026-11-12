"use client";

import Image from "next/image";
import {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { LandingDivision } from "./landing-division-data";
import styles from "./landing-divisions.module.css";

type LandingDivisionsProps = {
  divisions: LandingDivision[];
};

type IndicatorPosition = {
  left: number;
  width: number;
};

function DivisionArtwork({ variant }: { variant: number }) {
  const artwork = variant % 4;

  return (
    <div className={`${styles.artwork} ${styles[`artwork${artwork}`]}`} aria-hidden="true">
      <span className={styles.artworkIndex}>
        0{artwork + 1}
      </span>
      <svg viewBox="0 0 560 440" fill="none" focusable="false">
        {artwork === 0 && (
          <g className={styles.drawing}>
            <path d="M66 106h120v76h88v-54h150v74h68" />
            <path d="M96 332h92v-78h86v72h110v-96h108" />
            <path d="M186 106v-42h88v64M424 202v57h-40" />
            <rect x="225" y="160" width="100" height="96" />
            <path d="M246 182h58M246 201h58M246 220h38" />
            <circle cx="66" cy="106" r="7" />
            <circle cx="492" cy="202" r="7" />
            <circle cx="96" cy="332" r="7" />
            <circle cx="492" cy="270" r="7" />
          </g>
        )}
        {artwork === 1 && (
          <g className={styles.drawing}>
            <circle cx="280" cy="220" r="148" />
            <circle cx="280" cy="220" r="106" />
            <circle cx="280" cy="220" r="62" />
            <path d="M280 42v356M102 220h356" />
            <path d="m154 94 252 252M406 94 154 346" />
            <circle className={styles.drawingAccent} cx="386" cy="114" r="12" />
            <circle className={styles.drawingAccent} cx="174" cy="306" r="8" />
          </g>
        )}
        {artwork === 2 && (
          <g className={styles.drawing}>
            <rect x="92" y="78" width="160" height="112" />
            <rect x="278" y="78" width="190" height="68" />
            <rect x="278" y="166" width="92" height="152" />
            <rect x="396" y="166" width="72" height="152" />
            <rect x="92" y="210" width="160" height="108" />
            <path d="M112 110h96M112 132h72M298 108h148M112 246h120M298 274h52" />
            <path d="M92 352h376M72 78v240" />
            <circle className={styles.drawingAccent} cx="446" cy="352" r="8" />
          </g>
        )}
        {artwork === 3 && (
          <g className={styles.drawing}>
            <path d="M90 328 190 112l90 184 96-132 92 164" />
            <path d="M90 328h378M190 112H90v216M376 164h92v164" />
            <circle cx="190" cy="112" r="16" />
            <circle cx="280" cy="296" r="16" />
            <circle className={styles.drawingAccent} cx="376" cy="164" r="18" />
            <circle cx="468" cy="328" r="16" />
            <path d="M190 112v216M280 296v32M376 164v164" />
          </g>
        )}
      </svg>
      <span className={styles.artworkRule} />
    </div>
  );
}

export function LandingDivisions({ divisions }: LandingDivisionsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const transitionTimer = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [indicator, setIndicator] = useState<IndicatorPosition>({
    left: 0,
    width: 0,
  });
  const [canReveal, setCanReveal] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) return;

    let observer: IntersectionObserver | null = null;
    const frame = window.requestAnimationFrame(() => {
      setCanReveal(true);
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer?.disconnect();
          }
        },
        { threshold: 0.12 },
      );
      observer.observe(section);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  useEffect(
    () => () => {
      if (transitionTimer.current !== null) {
        window.clearTimeout(transitionTimer.current);
      }
    },
    [],
  );

  useLayoutEffect(() => {
    const tabList = tabListRef.current;
    const activeTab = tabRefs.current[activeIndex];
    if (!tabList || !activeTab) return;

    const updateIndicator = () => {
      setIndicator({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    };

    updateIndicator();
    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(tabList);
    resizeObserver.observe(activeTab);
    window.addEventListener("resize", updateIndicator);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeIndex, divisions.length]);

  function activateDivision(index: number) {
    if (index === activeIndex && !isTransitioning) return;

    if (transitionTimer.current !== null) {
      window.clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      setActiveIndex(index);
      setIsTransitioning(false);
      return;
    }

    setIsTransitioning(true);
    transitionTimer.current = window.setTimeout(() => {
      setActiveIndex(index);
      transitionTimer.current = null;
      window.requestAnimationFrame(() => setIsTransitioning(false));
    }, 110);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % divisions.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + divisions.length) % divisions.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = divisions.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    activateDivision(nextIndex);
    tabRefs.current[nextIndex]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  const activeDivision = divisions[activeIndex];

  return (
    <section
      className={styles.section}
      id="divisi"
      aria-labelledby="landing-divisions-title"
      ref={sectionRef}
    >
      <div className={styles.mascotBridge} aria-hidden="true">
        <Image
          src="/assets/mascot/mascot-point-720.webp"
          alt=""
          width={320}
          height={320}
          sizes="(max-width: 600px) 104px, (max-width: 900px) 124px, 144px"
          loading="lazy"
          draggable={false}
        />
      </div>

      <div className={`${styles.content} site-container`}>
        <div
          className={`${styles.reveal} ${
            canReveal && !isRevealed ? styles.waiting : ""
          } ${isRevealed ? styles.revealed : ""}`}
        >
          <header className={styles.header}>
            <p className={styles.eyebrow}>EXPLORE OUR DIVISIONS</p>
            <h2 className={styles.title} id="landing-divisions-title">
              Temukan ruang untuk berkembang.
            </h2>
            <p className={styles.introduction}>
              Setiap divisi memiliki peran, perspektif, dan cara berbeda untuk
              membangun teknologi bersama.
            </p>
          </header>

          {divisions.length > 0 && activeDivision ? (
            <div className={styles.explorer}>
              <div
                className={styles.tabList}
                role="tablist"
                aria-label="Pilih divisi RESTEX"
                aria-orientation="horizontal"
                ref={tabListRef}
              >
                {divisions.map((division, index) => (
                  <button
                    className={`${styles.tab} ${
                      activeIndex === index ? styles.activeTab : ""
                    }`}
                    id={`landing-division-tab-${index}`}
                    key={`${division.name}-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={activeIndex === index}
                    aria-controls="landing-division-panel"
                    tabIndex={activeIndex === index ? 0 : -1}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    onClick={() => activateDivision(index)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                  >
                    <span className={styles.tabNumber} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.tabName}>{division.name}</span>
                  </button>
                ))}
                <span
                  className={styles.activeIndicator}
                  aria-hidden="true"
                  style={{
                    left: indicator.left,
                    width: indicator.width,
                  }}
                />
              </div>

              <div
                className={styles.showcase}
                id="landing-division-panel"
                role="tabpanel"
                aria-labelledby={`landing-division-tab-${activeIndex}`}
                tabIndex={0}
              >
                <div
                  className={`${styles.showcaseCopy} ${
                    isTransitioning ? styles.exiting : styles.entering
                  }`}
                >
                  <p className={styles.showcaseEyebrow}>DIVISI RESTEX</p>
                  <p className={styles.showcaseNumber} aria-hidden="true">
                    {String(activeIndex + 1).padStart(2, "0")}
                  </p>
                  <h3 className={styles.divisionName}>{activeDivision.name}</h3>
                  <p className={styles.divisionDescription}>
                    {activeDivision.description}
                  </p>
                  <p className={styles.detailNote}>
                    Profil dan fokus kegiatan akan diperbarui setelah informasi
                    resmi tersedia.
                  </p>
                </div>

                <div
                  className={`${styles.showcaseVisual} ${
                    isTransitioning ? styles.exiting : styles.entering
                  }`}
                  key={activeIndex}
                >
                  <DivisionArtwork variant={activeIndex} />
                  <p className={styles.visualCaption}>
                    ILUSTRASI ABSTRAK <span>/{String(activeIndex + 1).padStart(2, "0")}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className={styles.emptyState}>
              Daftar divisi akan ditampilkan saat datanya tersedia.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
