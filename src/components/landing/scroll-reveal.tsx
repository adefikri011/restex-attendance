"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/* ──────────────────────────────────────────────────────────
   ScrollReveal v2 — Single shared IntersectionObserver
   - Auto-stagger batches by DOM order
   - End-of-page guard (scroll listener)
   - Curtain border-radius reading
   - will-change management
   - Focus-in instant reveal
   ────────────────────────────────────────────────────────── */

const MAX_STAGGER = 6;
const STAGGER_MS = 80;

function getStaggerMs(step: number): number {
  return Math.min(step, MAX_STAGGER) * STAGGER_MS;
}

/* ─── will-change helper ─── */
function attachWillChange(el: HTMLElement) {
  const type = el.getAttribute("data-reveal");
  switch (type) {
    case "curtain":
      el.style.willChange = "clip-path";
      break;
    case "line-x":
    case "line-y":
    case "rope":
      el.style.willChange = "scale";
      break;
    case "hang":
    case "settle":
      el.style.willChange = "opacity, translate, rotate";
      break;
    case "lines":
      el.style.willChange = "auto";
      break;
    default:
      el.style.willChange = "opacity, translate";
  }

  const removeWC = () => {
    el.style.willChange = "";
    el.removeEventListener("transitionend", removeWC);
  };
  el.addEventListener("transitionend", removeWC, { once: true });
  // fallback
  setTimeout(removeWC, 2000);
}

/* ─── Curtain: read border-radius and set --clip-r ─── */
function initCurtain(el: HTMLElement) {
  const r = getComputedStyle(el).borderTopLeftRadius;
  if (r && r !== "0px") {
    el.style.setProperty("--clip-r", r);
  }
  // After animation finishes, remove clip-path
  const done = () => {
    el.classList.add("curtain-done");
    el.removeEventListener("transitionend", done);
  };
  el.addEventListener("transitionend", done, { once: true });
  setTimeout(() => {
    if (!el.classList.contains("curtain-done")) {
      el.classList.add("curtain-done");
    }
  }, 1500);
}

export function SplitLines({
  children,
}: {
  children: string | ReactNode;
}) {
  const words = typeof children === "string" ? children.split(/\s+/) : [];
  const rootRef = useRef<HTMLSpanElement>(null);
  const [lines, setLines] = useState<string[][] | null>(null);

  useLayoutEffect(() => {
    if (typeof children !== "string") return;

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let measureFrame: number | null = null;
    let cancelled = false;

    const measureLines = () => {
      if (cancelled) return;
      const root = rootRef.current;
      if (!root) return;

      const wordElements = Array.from(
        root.querySelectorAll<HTMLSpanElement>("[data-w]"),
      );
      const measuredLines: string[][] = [];
      let currentTop: number | null = null;

      for (const wordElement of wordElements) {
        const top = wordElement.offsetTop;
        if (currentTop === null || top !== currentTop) {
          measuredLines.push([]);
          currentTop = top;
        }
        measuredLines[measuredLines.length - 1].push(
          wordElement.textContent ?? "",
        );
      }

      setLines(measuredLines);
    };

    const scheduleMeasure = () => {
      if (measureFrame !== null) cancelAnimationFrame(measureFrame);
      measureFrame = requestAnimationFrame(() => {
        measureFrame = null;
        measureLines();
      });
    };

    const markRevealedTitle = () => {
      const title = rootRef.current?.closest<HTMLElement>(
        '[data-reveal="lines"]',
      );
      if (title?.classList.contains("is-in")) {
        title.classList.add("no-anim");
      }
    };

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      markRevealedTitle();
      setLines(null);
      resizeTimer = setTimeout(scheduleMeasure, 150);
    };

    const handleFontsReady = () => {
      setLines(null);
      scheduleMeasure();
    };

    measureLines();
    void document.fonts?.ready.then(handleFontsReady);
    window.addEventListener("resize", handleResize);
    document.fonts?.addEventListener("loadingdone", handleFontsReady);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      document.fonts?.removeEventListener("loadingdone", handleFontsReady);
      if (resizeTimer) clearTimeout(resizeTimer);
      if (measureFrame !== null) cancelAnimationFrame(measureFrame);
    };
  }, [children]);

  if (typeof children !== "string") {
    return <>{children}</>;
  }

  if (lines === null) {
    return (
      <span ref={rootRef} style={{ display: "contents" }}>
        {words.map((word, index) => (
          <span data-w key={`${word}-${index}`}>
            {word}
            {index < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span ref={rootRef} style={{ display: "contents" }}>
      {lines.map((line, index) => (
        <span className="ln" key={`${line.join(" ")}-${index}`}>
          <span
            className="ln-in"
            style={{ "--li": `${index * 90}ms` } as CSSProperties}
          >
            {line.join(" ")}
          </span>
          {index < lines.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}

/* ─── End-of-page guard ─── */
function revealBottomElements() {
  const vh = window.innerHeight;
  const atBottom =
    vh + window.scrollY >= document.documentElement.scrollHeight - 4;

  if (!atBottom) return;

  const unrevealed = document.querySelectorAll<HTMLElement>(
    "[data-reveal]:not(.is-in)",
  );
  for (const el of unrevealed) {
    const rect = el.getBoundingClientRect();
    if (rect.top < vh) {
      el.classList.add("is-in");
    }
  }
}

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!document.documentElement.classList.contains("reveal-ready")) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    // ── Intersection Observer with auto-stagger ──
    const observer = new IntersectionObserver(
      (entries) => {
        // Collect all intersecting entries in this batch
        const intersecting: HTMLElement[] = [];
        for (const entry of entries) {
          if (entry.isIntersecting) {
            intersecting.push(entry.target as HTMLElement);
          }
        }

        if (intersecting.length === 0) return;

        // Sort by DOM order (compareDocumentPosition)
        intersecting.sort((a, b) => {
          const pos = a.compareDocumentPosition(b);
          if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
          if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
          return 0;
        });

        // Assign auto-stagger delay
        for (let i = 0; i < intersecting.length; i++) {
          const el = intersecting[i];
          const manualStep = el.getAttribute("data-reveal-step");

          if (manualStep !== null) {
            // Manual step overrides
            el.style.setProperty(
              "--d",
              `${getStaggerMs(parseInt(manualStep, 10))}ms`,
            );
          } else {
            // Auto-stagger based on batch order
            el.style.setProperty("--d", `${getStaggerMs(i)}ms`);
          }

          attachWillChange(el);
          el.classList.add("is-in");
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.01,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    const registeredElements = new WeakSet<HTMLElement>();
    const registerElements = (elements: HTMLElement[]) => {
      for (const el of elements) {
        if (registeredElements.has(el)) continue;
        registeredElements.add(el);

        if (el.getAttribute("data-reveal") === "curtain") {
          initCurtain(el);
        }

        if (el.classList.contains("is-in")) continue;
        if (el.getBoundingClientRect().bottom <= 0) {
          el.classList.add("is-in", "no-anim");
          continue;
        }
        observer.observe(el);
      }
    };

    registerElements(
      Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")),
    );

    const main = document.querySelector("main");
    let mutationFrame: number | null = null;
    const mutations = main
      ? new MutationObserver(() => {
          if (mutationFrame !== null) return;
          mutationFrame = requestAnimationFrame(() => {
            mutationFrame = null;
            registerElements(
              Array.from(main.querySelectorAll<HTMLElement>("[data-reveal]")),
            );
            revealBottomElements();
          });
        })
      : null;
    if (mutations && main) {
      mutations.observe(main, { childList: true, subtree: true });
    }

    // ── Focus-in handler ──
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const revealEl = target.closest<HTMLElement>("[data-reveal]");
      if (revealEl && !revealEl.classList.contains("is-in")) {
        revealEl.classList.add("is-in", "no-anim");
        observer.unobserve(revealEl);
      }
    };
    document.addEventListener("focusin", handleFocusIn);

    // ── End-of-page scroll guard ──
    let rafPending = false;
    const handleScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        revealBottomElements();
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    const handleResize = () => {
      requestAnimationFrame(revealBottomElements);
    };
    window.addEventListener("resize", handleResize);

    // Initial check for bottom elements
    revealBottomElements();

    return () => {
      observer.disconnect();
      mutations?.disconnect();
      document.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (mutationFrame !== null) cancelAnimationFrame(mutationFrame);
    };
  }, [pathname]);

  return null;
}
