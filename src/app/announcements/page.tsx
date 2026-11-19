import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getPublishedAnnouncements } from "@/lib/announcement-service";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Pengumuman | RESTEX",
  description: "Pusat informasi dan pengumuman RESTEX.",
};

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeZone: "Asia/Jakarta",
      }).format(value)
    : "";
}

export default async function AnnouncementsPage() {
  await connection();
  const announcements = await getPublishedAnnouncements();

  return (
    <main className={styles.page}>
      <div className={`${styles.content} site-container`}>
        <p className={styles.eyebrow}>RESTEX / SIGNAL CENTER</p>
        <h1 className={styles.title}>Pengumuman RESTEX</h1>
        <p className={styles.description}>
          Informasi resmi kegiatan, kesempatan, dan kabar terbaru dari RESTEX.
        </p>
        <div className={styles.list}>
          {announcements.length ? announcements.map((announcement) => (
            <article className={styles.card} key={announcement.slug}>
              <p className={styles.meta}>
                {announcement.type === "ACTIVITY"
                  ? "Kegiatan"
                  : announcement.type === "OPPORTUNITY"
                    ? "Kesempatan"
                    : "Pengumuman"}
                {announcement.publishedAt ? ` · ${formatDate(announcement.publishedAt)}` : ""}
              </p>
              <h2>{announcement.title}</h2>
              <p>{announcement.excerpt}</p>
              <Link href={`/announcements/${announcement.slug}`} className={styles.link}>
                Baca pengumuman
              </Link>
            </article>
          )) : (
            <p className={styles.empty}>Belum ada pengumuman yang diterbitkan.</p>
          )}
        </div>
        <Link className={styles.backLink} href="/">
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
