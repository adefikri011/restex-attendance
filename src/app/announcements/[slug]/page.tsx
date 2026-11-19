import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getPublishedAnnouncement } from "@/lib/announcement-service";
import styles from "../page.module.css";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const announcement = await getPublishedAnnouncement((await params).slug);
  return {
    title: announcement ? `${announcement.title} | RESTEX` : "Pengumuman | RESTEX",
    description: announcement?.excerpt ?? "Pengumuman RESTEX.",
  };
}

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const announcement = await getPublishedAnnouncement((await params).slug);
  if (!announcement) notFound();

  return (
    <main className={styles.page}>
      <article className={`${styles.content} site-container`}>
        <Link className={styles.backLink} href="/announcements">
          Kembali ke semua pengumuman
        </Link>
        <p className={styles.eyebrow}>PENGUMUMAN RESTEX</p>
        <h1 className={styles.title}>{announcement.title}</h1>
        <p className={styles.description}>{announcement.excerpt}</p>
        <p className={styles.date}>
          {announcement.publishedAt
            ? new Intl.DateTimeFormat("id-ID", {
                dateStyle: "long",
                timeZone: "Asia/Jakarta",
              }).format(announcement.publishedAt)
            : ""}
        </p>
        <div className={styles.articleBody}>
          {announcement.content.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
