"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RecruitmentStatus } from "@/lib/recruitment";
import { formatTanggal } from "@/lib/recruitment";
import styles from "./landing-announcements.module.css";

type PostType = "pengumuman" | "kegiatan" | "kesempatan";

type Post = {
  type: PostType;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  coverImage?: string;
};

const POSTS: Post[] = [
  {
    type: "pengumuman",
    slug: "pendaftaran-anggota-baru-2026-2027",
    title: "Pendaftaran anggota baru periode 2026–2027",
    excerpt:
      "Bergabung untuk belajar, merancang, dan mengerjakan proyek teknologi bersama RESTEX.",
    publishedAt: "2026-11-12",
  },
  {
    type: "kegiatan",
    slug: "workshop-dasar-mikrokontroler",
    title: "Workshop dasar mikrokontroler",
    excerpt:
      "Kenali rangkaian dan pemrograman mikrokontroler melalui sesi praktik bersama.",
    publishedAt: "2026-11-09",
  },
  {
    type: "kesempatan",
    slug: "tim-kompetisi-inovasi-kampus",
    title: "Pendaftaran tim kompetisi inovasi kampus",
    excerpt:
      "Kesempatan untuk membentuk tim dan menyiapkan gagasan teknologi untuk kompetisi kampus.",
    publishedAt: "2026-11-05",
  },
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: string) {
  return dateFormatter.format(parseLocalDate(date));
}

function getTypeLabel(type: PostType) {
  switch (type) {
    case "pengumuman":
      return "Pengumuman";
    case "kegiatan":
      return "Kegiatan";
    case "kesempatan":
      return "Kesempatan";
  }
}

function ArrowIndicator({
  direction = "right",
}: {
  direction?: "left" | "right";
}) {
  return (
    <svg
      className={`${styles.arrow} ${direction === "left" ? styles.arrowLeft : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PostArtwork({ type }: { type: PostType }) {
  return (
    <div className={styles.artworkPanel} aria-hidden="true">
      <div className={styles.artworkWindow}>
        <div className={styles.artworkToolbar}>
          <span />
          <span />
          <span />
          <i />
          <i />
          <i />
        </div>
        <div className={styles.artworkCanvas}>
          <svg
            className={styles.artworkIllustration}
            viewBox="0 0 480 260"
            fill="none"
          >
            {type === "kegiatan" ? (
              <>
                <path className={styles.artworkTrace} d="M92 88h82v38h54" />
                <path className={styles.artworkTrace} d="M306 91h70v48" />
                <path className={styles.artworkTrace} d="M99 181h72v-27h57" />
                <path className={styles.artworkTrace} d="M308 167h69v-28" />
                <rect
                  className={styles.artworkBoard}
                  x="172"
                  y="76"
                  width="136"
                  height="110"
                  rx="10"
                />
                <rect
                  className={styles.artworkChip}
                  x="211"
                  y="105"
                  width="58"
                  height="52"
                  rx="5"
                />
                <path
                  className={styles.artworkPin}
                  d="M224 95v10m16-10v10m16-10v10m-32 52v10m16-10v10m16-10v10m-56-54h11m-11 16h11m-11 16h11m58-32h11m-11 16h11m-11 16h11"
                />
                <circle className={styles.artworkSignal} cx="92" cy="88" r="6" />
                <circle className={styles.artworkSignal} cx="376" cy="139" r="6" />
                <circle className={styles.artworkNode} cx="99" cy="181" r="5" />
                <circle className={styles.artworkNode} cx="376" cy="139" r="20" />
              </>
            ) : (
              <>
                <path className={styles.artworkTrace} d="M105 186 190 96l79 61 95-92" />
                <path className={styles.artworkTraceMuted} d="M105 212h278M105 72v140" />
                <circle className={styles.artworkNode} cx="105" cy="186" r="9" />
                <circle className={styles.artworkSignal} cx="190" cy="96" r="12" />
                <circle className={styles.artworkNode} cx="269" cy="157" r="9" />
                <circle className={styles.artworkSignal} cx="364" cy="65" r="16" />
                <path className={styles.artworkSpark} d="M364 40v-13m25 38h13m-56-18-9-9m43 52 9 9" />
                <rect className={styles.artworkCard} x="282" y="175" width="93" height="22" rx="4" />
              </>
            )}
          </svg>
        </div>
      </div>
      <span className={styles.artworkCaption}>
        {type === "kegiatan" ? "Ruang praktik" : "Ruang gagasan"}
      </span>
    </div>
  );
}

export function LandingAnnouncements({
  recruitmentStatus,
}: {
  recruitmentStatus: RecruitmentStatus;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [revealState, setRevealState] = useState<
    "idle" | "waiting" | "shown"
  >("idle");
  const [activePostIndex, setActivePostIndex] = useState(0);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    const frame = window.requestAnimationFrame(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const section = sectionRef.current;
      if (!section || !("IntersectionObserver" in window)) return;

      setRevealState("waiting");
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setRevealState("shown");
            observer?.disconnect();
          }
        },
        { threshold: 0.08 },
      );

      observer.observe(section);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  const posts = [...POSTS].sort(
    (a, b) =>
      Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  const activeRecruitmentStatus =
    recruitmentStatus.state === "open" ? recruitmentStatus : undefined;
  const activeAnnouncement = activeRecruitmentStatus
    ? posts.find((post) => post.type === "pengumuman")
    : undefined;
  const latestPosts = posts
    .filter((post) => post.type !== "pengumuman")
    .slice(0, 4);
  const activePost = latestPosts[activePostIndex];
  const isEmpty = !activeAnnouncement && latestPosts.length === 0;

  return (
    <section
      className={styles.section}
      id="pengumuman"
      aria-labelledby="landing-announcements-title"
      ref={sectionRef}
      data-reveal={revealState}
    >
      <div className={`${styles.content} site-container`}>
        <header className={styles.header}>
          <h2 className={styles.title} id="landing-announcements-title">
            Kabar terbaru
          </h2>
          <Link className={styles.viewAll} href="/kabar">
            Lihat semua
            <ArrowIndicator />
          </Link>
        </header>

        {activePost ? (
          <div
            className={styles.postCarousel}
            role="region"
            aria-label="Artikel dan kegiatan RESTEX"
            aria-roledescription="carousel"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = touchStartX.current;
              const endX = event.changedTouches[0]?.clientX;
              touchStartX.current = null;
              if (startX === null || endX === undefined) return;
              const distance = endX - startX;
              if (Math.abs(distance) < 48) return;
              setActivePostIndex((index) =>
                Math.min(
                  Math.max(index + (distance < 0 ? 1 : -1), 0),
                  latestPosts.length - 1,
                ),
              );
            }}
          >
            <article
              className={styles.postSlide}
              key={activePost.slug}
              aria-roledescription="slide"
              aria-label={`${activePostIndex + 1} dari ${latestPosts.length}`}
            >
              <PostArtwork type={activePost.type} />
              <div className={styles.postCopy}>
                <div className={styles.postMeta}>
                  <span className={styles.postType}>
                    {getTypeLabel(activePost.type)}
                  </span>
                  <time dateTime={activePost.publishedAt}>
                    {formatDate(activePost.publishedAt)}
                  </time>
                </div>
                <h3 className={styles.postTitle}>{activePost.title}</h3>
                <p className={styles.postExcerpt}>{activePost.excerpt}</p>
                <Link
                  className={styles.postLink}
                  href={`/kabar/${activePost.slug}`}
                >
                  Baca selengkapnya
                  <ArrowIndicator />
                </Link>
              </div>
            </article>
            <div className={styles.carouselControls}>
              <span
                className={styles.carouselCount}
                aria-live="polite"
                aria-atomic="true"
              >
                {activePostIndex + 1} dari {latestPosts.length}
              </span>
              <div className={styles.carouselProgress} aria-hidden="true">
                <span
                  style={{
                    transform: `scaleX(${(activePostIndex + 1) / latestPosts.length})`,
                  }}
                />
              </div>
              <div className={styles.carouselButtons}>
                <button
                  className={styles.carouselButton}
                  type="button"
                  aria-label="Artikel sebelumnya"
                  disabled={activePostIndex === 0}
                  onClick={() =>
                    setActivePostIndex((index) => Math.max(index - 1, 0))
                  }
                >
                  <ArrowIndicator direction="left" />
                </button>
                <button
                  className={styles.carouselButton}
                  type="button"
                  aria-label="Artikel berikutnya"
                  disabled={activePostIndex === latestPosts.length - 1}
                  onClick={() =>
                    setActivePostIndex((index) =>
                      Math.min(index + 1, latestPosts.length - 1),
                    )
                  }
                >
                  <ArrowIndicator />
                </button>
              </div>
            </div>
          </div>
        ) : isEmpty ? (
          <div className={styles.emptyState}>
            <p>
              Belum ada kabar. Pantau Instagram RESTEX untuk info terbaru.
            </p>
            <Image
              src="/assets/mascot/floating-guide.webp"
              alt=""
              width={64}
              height={64}
              aria-hidden="true"
            />
          </div>
        ) : null}

        {activeAnnouncement && (
          <Link
            className={styles.announcementFeature}
            href={`/kabar/${activeAnnouncement.slug}`}
          >
            <span className={styles.announcementCopy}>
              <span className={styles.announcementMeta}>
                <span>Pengumuman</span>
                <span className={styles.announcementStatus}>Sedang dibuka</span>
              </span>
              <span className={styles.announcementTitle}>
                {activeAnnouncement.title}
              </span>
              <span className={styles.announcementExcerpt}>
                {activeAnnouncement.excerpt}
              </span>
              <span className={styles.announcementLink}>
                Lihat pengumuman
                <ArrowIndicator />
              </span>
            </span>
            {activeRecruitmentStatus?.daysLeft !== undefined &&
              activeRecruitmentStatus.closesAt && (
                <span className={styles.announcementDeadline}>
                  <span className={styles.announcementDays}>
                    {activeRecruitmentStatus.daysLeft}
                  </span>
                  <span className={styles.deadline}>
                    hari lagi · tutup{" "}
                    <time dateTime={activeRecruitmentStatus.closesAt}>
                      {formatTanggal(activeRecruitmentStatus.closesAt)}
                    </time>
                  </span>
                </span>
              )}
          </Link>
        )}
      </div>
    </section>
  );
}
