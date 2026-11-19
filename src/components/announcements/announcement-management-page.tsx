"use client";

import { useState, type FormEvent } from "react";
import { Megaphone, Save } from "lucide-react";
import styles from "./announcement-management-page.module.css";

type Announcement = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  type: "ANNOUNCEMENT" | "ACTIVITY" | "OPPORTUNITY";
  isPublished: boolean;
  publishedAt: Date | string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatDate(value: Date | string | null) {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeZone: "Asia/Jakarta",
      }).format(new Date(value))
    : "Belum diterbitkan";
}

export function AnnouncementManagementPage({
  initialAnnouncements,
}: {
  initialAnnouncements: Announcement[];
}) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    type: "ANNOUNCEMENT" as Announcement["type"],
    isPublished: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Pengumuman gagal disimpan.",
        );
      }
      window.location.reload();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Pengumuman gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePublication(item: Announcement) {
    setBusyId(item.id);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/announcements/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Status pengumuman gagal diperbarui.",
        );
      }
      setAnnouncements((current) =>
        current.map((announcement) =>
          announcement.id === item.id
            ? { ...announcement, isPublished: !item.isPublished, publishedAt: !item.isPublished ? new Date() : null }
            : announcement,
        ),
      );
      setSuccess(!item.isPublished ? "Pengumuman diterbitkan untuk semua pengunjung." : "Pengumuman disembunyikan.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Status pengumuman gagal diperbarui.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>KOMUNIKASI RESTEX</span>
        <h1>Kelola pengumuman</h1>
        <p>Buat informasi yang dapat dibaca semua pengunjung website.</p>
      </header>

      <form className={styles.form} onSubmit={create} aria-busy={isSaving}>
        <section className={styles.card}>
          <div className={styles.sectionHeading}>
            <Megaphone size={19} aria-hidden="true" />
            <div>
              <h2>Pengumuman baru</h2>
              <p>Pengumuman yang diterbitkan langsung terlihat di halaman publik.</p>
            </div>
          </div>
          <label>
            Judul
            <input maxLength={180} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label>
            Ringkasan
            <textarea maxLength={320} required rows={3} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} />
          </label>
          <label>
            Isi pengumuman
            <textarea required rows={8} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} />
            <small>Pisahkan paragraf dengan satu baris kosong.</small>
          </label>
          <div className={styles.row}>
            <label>
              Jenis
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Announcement["type"] })}>
                <option value="ANNOUNCEMENT">Pengumuman</option>
                <option value="ACTIVITY">Kegiatan</option>
                <option value="OPPORTUNITY">Kesempatan</option>
              </select>
            </label>
            <label className={styles.checkbox}>
              <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} />
              Terbitkan sekarang
            </label>
          </div>
          {(error || success) && <p className={error ? styles.error : styles.success} role={error ? "alert" : "status"}>{error || success}</p>}
          <button className={styles.saveButton} type="submit" disabled={isSaving}>
            <Save size={16} aria-hidden="true" />
            {isSaving ? "Menyimpan..." : "Simpan pengumuman"}
          </button>
        </section>
      </form>

      <section className={styles.card}>
        <div className={styles.sectionHeading}>
          <Megaphone size={19} aria-hidden="true" />
          <div>
            <h2>Daftar pengumuman</h2>
            <p>{announcements.length} pengumuman tersimpan.</p>
          </div>
        </div>
        <div className={styles.list}>
          {announcements.map((announcement) => (
            <article className={styles.item} key={announcement.id}>
              <div>
                <strong>{announcement.title}</strong>
                <span>{announcement.isPublished ? `Terbit ${formatDate(announcement.publishedAt)}` : "Draf"}</span>
              </div>
              <button type="button" onClick={() => void togglePublication(announcement)} disabled={busyId === announcement.id}>
                {busyId === announcement.id ? "Menyimpan..." : announcement.isPublished ? "Sembunyikan" : "Terbitkan"}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
