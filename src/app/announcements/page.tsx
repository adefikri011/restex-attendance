import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Pengumuman | RESTEX",
  description: "Pusat informasi dan pengumuman RESTEX.",
};

export default function AnnouncementsPage() {
  return (
    <main className={styles.page}>
      <div className={`${styles.content} site-container`}>
        <p className={styles.eyebrow}>RESTEX / SIGNAL CENTER</p>
        <p className={styles.index}>ANNOUNCEMENTS · 00</p>
        <h1 className={styles.title}>Pusat pengumuman sedang disiapkan.</h1>
        <p className={styles.description}>
          Halaman ini akan memuat pengumuman RESTEX setelah informasi resminya
          tersedia.
        </p>
        <Link className={styles.backLink} href="/#pengumuman">
          Kembali ke pratinjau pengumuman <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
