"use client";

import Image from "next/image";
import {
  type CSSProperties,
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

const blueprintDelay = (delay: number) =>
  ({ "--draw-delay": `${delay}s` }) as CSSProperties;

function BlueprintPath({
  d,
  delay = 0,
  accent = false,
  className = "",
}: {
  d: string;
  delay?: number;
  accent?: boolean;
  className?: string;
}) {
  return (
    <path
      d={d}
      pathLength={1}
      className={`${styles.blueprintPath} ${accent ? styles.blueprintAccent : ""} ${className}`}
      style={blueprintDelay(delay)}
    />
  );
}

function BlueprintIllustration({ variant }: { variant: number }) {
  const artwork = variant % 4;
  const labels = [
    "Blueprint papan mikrokontroler dengan jalur PCB dan sinyal",
    "Blueprint editor kode dengan nomor baris dan cabang git",
    "Blueprint grafik penelitian, titik data, dan kaca pembesar",
    "Blueprint roda gigi mekanis dengan ukuran teknis",
  ];

  return (
    <div className={`${styles.artwork} ${styles[`artwork${artwork}`]}`}>
      <span className={styles.artworkIndex} aria-hidden="true">
        0{artwork + 1}
      </span>
      <svg
        className={styles.blueprintSvg}
        viewBox="0 0 520 340"
        fill="none"
        role="img"
        aria-label={labels[artwork]}
        focusable="false"
      >
        {artwork === 0 && (
          <g>
            <BlueprintPath d="M180 104H144L118 78H62" delay={0.05} />
            <BlueprintPath d="M180 128H132M106 128H62" delay={0.1} />
            <BlueprintPath d="M180 152H142L116 178H62" delay={0.15} />
            <BlueprintPath d="M180 188H138L112 214H62" delay={0.2} />
            <BlueprintPath d="M340 104H374L400 78H458" delay={0.1} />
            <BlueprintPath d="M340 128H372M392 128H458" delay={0.15} />
            <BlueprintPath d="M340 152H378L404 178H458" delay={0.2} />
            <BlueprintPath d="M340 188H376L402 214H458" delay={0.25} />
            <BlueprintPath d="M206 78V56L184 34H142" delay={0.2} />
            <BlueprintPath d="M314 78V56L336 34H378" delay={0.25} />
            <BlueprintPath d="M206 222V252L180 278H142" delay={0.3} />
            <BlueprintPath d="M314 222V252L340 278H378" delay={0.35} />
            <BlueprintPath d="M340 152H378L404 178H458" delay={0.25} accent />
            <path
              d="M340 152H378L404 178H458"
              pathLength={1}
              className={`${styles.blueprintPath} ${styles.signalPacket}`}
            />
            <rect
              x="180"
              y="78"
              width="160"
              height="144"
              rx="4"
              className={styles.blueprintShape}
            />
            <rect
              x="202"
              y="100"
              width="116"
              height="100"
              rx="2"
              className={styles.blueprintInner}
            />
            <text x="260" y="149" textAnchor="middle" className={styles.blueprintLabel}>
              MCU
            </text>
            <text x="260" y="168" textAnchor="middle" className={styles.blueprintMicroLabel}>
              CONTROL UNIT
            </text>
            {[94, 118, 142, 166, 190, 214].map((y) => (
              <g key={y} className={styles.blueprintPin}>
                <path d={`M168 ${y}h12M340 ${y}h12`} />
              </g>
            ))}
            {[62, 458].map((x) =>
              [78, 128, 178, 214].map((y) => (
                <circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r="4.5"
                  className={x === 458 && y === 178 ? styles.blueprintActivePad : styles.blueprintPad}
                />
              )),
            )}
            <BlueprintPath d="M76 258H444" delay={0.4} className={styles.signalAxis} />
            <BlueprintPath
              d="M78 258c18 0 18-22 36-22s18 44 36 44 18-44 36-44 18 22 36 22h220"
              delay={0.45}
              accent
              className={styles.signalWave}
            />
            <text x="78" y="286" className={styles.blueprintMicroLabel}>PWM SIGNAL</text>
            <text x="442" y="286" textAnchor="end" className={styles.blueprintMicroLabel}>3.3V</text>
          </g>
        )}

        {artwork === 1 && (
          <g>
            <rect
              x="40"
              y="42"
              width="326"
              height="254"
              rx="4"
              className={styles.blueprintShape}
            />
            <BlueprintPath d="M40 76H366M40 268H366" delay={0.05} />
            {[58, 72, 86].map((x) => (
              <circle key={x} cx={x} cy="59" r="3" className={styles.blueprintPad} />
            ))}
            <BlueprintPath d="M84 76V268" delay={0.1} className={styles.blueprintFaint} />
            <BlueprintPath d="M104 76V56a3 3 0 0 1 3-3h78a3 3 0 0 1 3 3v20" delay={0.15} />
            <BlueprintPath d="M104 76h84" delay={0.2} accent />
            <text x="108" y="68" className={styles.blueprintMicroLabel}>restex.ts</text>
            {[1, 2, 3, 4, 5, 6, 7].map((line) => (
              <text key={line} x="72" y={102 + line * 22} textAnchor="end" className={styles.blueprintLineNumber}>
                {line}
              </text>
            ))}
            <rect x="86" y="211" width="266" height="22" className={styles.codeHighlight} />
            <text x="98" y="124" className={styles.blueprintCode}>
              <tspan className={styles.codeMuted}>import</tspan> {"{ build }"} <tspan className={styles.codeMuted}>from</tspan>
            </text>
            <text x="98" y="168" className={styles.blueprintCode}>
              <tspan className={styles.codeMuted}>const</tspan> team = build(
            </text>
            <text x="114" y="190" className={styles.blueprintCode}>
              division: <tspan className={styles.codeAccent}>&quot;restex&quot;</tspan>,
            </text>
            <text x="114" y="212" className={styles.blueprintCode}>
              collaboration: <tspan className={styles.codeMuted}>true</tspan>,
            </text>
            <text x="98" y="234" className={styles.blueprintCode}>
              {"});"}
            </text>
            <text x="98" y="256" className={styles.blueprintCode}>
              team.<tspan className={styles.codeMuted}>build</tspan>();
            </text>
            <rect x="192" y="239" width="6" height="16" className={styles.codeCursor} />
            <BlueprintPath d="M430 76V270" delay={0.1} />
            <BlueprintPath d="M430 126c0 25 48 18 48 44v34c0 22-48 18-48 42" delay={0.2} />
            {[126, 202, 246, 270].map((y) => (
              <circle
                key={y}
                cx={y === 202 ? 478 : 430}
                cy={y}
                r="5"
                className={y === 126 ? styles.blueprintActivePad : styles.blueprintPad}
              />
            ))}
            <text x="444" y="130" className={styles.blueprintMicroLabel}>main</text>
            <text x="486" y="206" className={styles.blueprintMicroLabel}>feat</text>
            <text x="418" y="290" textAnchor="end" className={styles.blueprintMicroLabel}>init</text>
          </g>
        )}

        {artwork === 2 && (
          <g>
            <BlueprintPath d="M58 62V274H316" delay={0.05} />
            {[100, 146, 192, 238].map((y) => (
              <BlueprintPath
                key={y}
                d={`M58 ${y}H310`}
                delay={0.1}
                className={styles.blueprintGridLine}
              />
            ))}
            <BlueprintPath d="M76 238C112 228 134 222 162 214S212 198 238 172 280 118 310 94" delay={0.15} accent className={styles.researchCurve} />
            {[
              [82, 236],
              [112, 228],
              [142, 220],
              [172, 210],
              [202, 198],
              [230, 178],
              [254, 150],
              [280, 120],
            ].map(([x, y], index) => (
              <circle
                key={x}
                cx={x}
                cy={y}
                r={index === 6 ? 6 : 3.5}
                className={index === 6 ? styles.blueprintActivePad : styles.blueprintPad}
                style={index === 6 ? undefined : blueprintDelay(0.35 + index * 0.06)}
              />
            ))}
            <BlueprintPath d="M280 120L346 96M280 120L346 196" delay={0.35} className={styles.blueprintFaint} />
            <circle cx="400" cy="142" r="66" className={styles.blueprintLens} />
            <circle cx="400" cy="142" r="54" className={styles.blueprintFaintCircle} />
            <BlueprintPath d="m448 190 42 42" delay={0.4} className={styles.magnifierHandle} />
            <BlueprintPath d="M358 154c14-4 23-10 34-23s18-22 28-28" delay={0.45} accent className={styles.researchCurve} />
            <circle cx="420" cy="103" r="5" className={styles.blueprintActivePad} />
            <circle cx="420" cy="103" r="11" className={styles.researchPulse} />
            <text x="72" y="84" className={styles.blueprintMicroLabel}>OBSERVATION / 08</text>
            <text x="316" y="292" textAnchor="end" className={styles.blueprintMicroLabel}>SAMPLE</text>
            <text x="400" y="226" textAnchor="middle" className={styles.blueprintMicroLabel}>×1.9</text>
          </g>
        )}

        {artwork === 3 && (
          <MechanicalBlueprint />
        )}
      </svg>
      <span className={styles.artworkRule} aria-hidden="true" />
    </div>
  );
}

function gearPath(
  cx: number,
  cy: number,
  teeth: number,
  pitchRadius: number,
  module: number,
) {
  const outerRadius = pitchRadius + module;
  const rootRadius = pitchRadius - 1.25 * module;
  const pitch = (2 * Math.PI) / teeth;
  const point = (radius: number, angle: number) =>
    `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`;

  let path = `M${point(rootRadius, -0.29 * pitch)}`;
  for (let tooth = 0; tooth < teeth; tooth += 1) {
    const angle = tooth * pitch;
    path += `L${point(outerRadius, angle - 0.15 * pitch)}L${point(outerRadius, angle + 0.15 * pitch)}L${point(rootRadius, angle + 0.29 * pitch)}A${rootRadius} ${rootRadius} 0 0 1 ${point(rootRadius, angle + pitch - 0.29 * pitch)}`;
  }
  return `${path}Z`;
}

function MechanicalBlueprint() {
  const gearModule = 10;
  const teethA = 18;
  const teethB = 12;
  const radiusA = (gearModule * teethA) / 2;
  const radiusB = (gearModule * teethB) / 2;
  const centerA = { x: 170, y: 165 };
  const centerB = { x: centerA.x + radiusA + radiusB, y: centerA.y };

  return (
    <g>
      <path d={`M76 ${centerA.y}H${centerB.x + 82}M${centerA.x} 60V276M${centerB.x} 94V250`} className={styles.blueprintDimensionDash} />
      <circle cx={centerA.x} cy={centerA.y} r={radiusA} className={styles.blueprintPitchCircle} />
      <circle cx={centerB.x} cy={centerB.y} r={radiusB} className={styles.blueprintPitchCircle} />
      <g
        className={styles.gearSpin}
      >
        <path d={gearPath(centerA.x, centerA.y, teethA, radiusA, gearModule)} className={styles.gearOutline} />
        <circle cx={centerA.x} cy={centerA.y} r="34" className={styles.blueprintFaintCircle} />
        <circle cx={centerA.x} cy={centerA.y} r="14" className={styles.blueprintShape} />
        <circle cx={centerA.x} cy={centerA.y} r="5" className={styles.blueprintShape} />
        <path d={`M${centerA.x - 3} ${centerA.y - 8}v-7h6v7`} className={styles.blueprintGearSlot} />
      </g>
      <g
        className={styles.gearSpinReverse}
      >
        <path d={gearPath(centerB.x, centerB.y, teethB, radiusB, gearModule)} className={styles.gearOutline} />
        <circle cx={centerB.x} cy={centerB.y} r="19" className={styles.blueprintFaintCircle} />
        <circle cx={centerB.x} cy={centerB.y} r="7" className={styles.blueprintShape} />
      </g>
      <circle cx={centerA.x + radiusA} cy={centerA.y} r="4" className={styles.blueprintActivePad} />
      <circle cx={centerA.x + radiusA} cy={centerA.y} r="12" className={styles.researchPulse} />
      <BlueprintPath d={`M${centerA.x} 270V296M${centerB.x} 246V296M${centerA.x} 292H${centerB.x}`} delay={0.2} />
      <path d={`M${centerA.x} 292l7-3v6zM${centerB.x} 292l-7-3v6z`} className={styles.dimensionArrow} />
      <text x={(centerA.x + centerB.x) / 2} y="310" textAnchor="middle" className={styles.blueprintMicroLabel}>CENTER DISTANCE</text>
      <rect x="408" y="52" width="88" height="76" className={styles.blueprintShape} />
      <BlueprintPath d="M408 76H496M408 101H496" delay={0.25} className={styles.blueprintFaint} />
      <text x="416" y="69" className={styles.blueprintMicroLabel}>GEAR SET</text>
      <text x="416" y="94" className={styles.blueprintMicroLabel}>TEETH</text>
      <text x="488" y="94" textAnchor="end" className={styles.blueprintMicroLabel}>18 : 12</text>
      <text x="416" y="118" className={styles.blueprintMicroLabel}>RATIO 3:2</text>
    </g>
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
                  <BlueprintIllustration variant={activeIndex} />
                  <p className={styles.visualCaption}>
                    BLUEPRINT DIVISI <span>/{String(activeIndex + 1).padStart(2, "0")}</span>
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
