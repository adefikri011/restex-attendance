"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Plus,
  Save,
  Trash2,
  UsersRound,
  Video,
  XCircle,
} from "lucide-react";
import type { ApplicantMeetingAttendance } from "@/generated/prisma/client";
import styles from "./recruitment-meetings-page.module.css";

type MeetingApplicant = {
  id: string;
  fullName: string;
  email: string;
  meetingAttendance: ApplicantMeetingAttendance | null;
};

type MeetingSession = {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  location: string;
  capacity: number;
  isActive: boolean;
  bookedCount: number;
  applications: MeetingApplicant[];
};

type MeetingOverview = {
  sessions: MeetingSession[];
  onlineApplications: MeetingApplicant[];
  zoomEnabled: boolean;
  zoomUrl: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatSessionDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatSessionTime(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getErrorMessage(result: unknown, fallback: string) {
  return isRecord(result) && typeof result.error === "string"
    ? result.error
    : fallback;
}

function ParticipantList({
  participants,
  label,
}: {
  participants: MeetingApplicant[];
  label: string;
}) {
  return (
    <details className={styles.participantDetails}>
      <summary>
        <UsersRound size={15} aria-hidden="true" />
        {label} ({participants.length})
      </summary>
      {participants.length ? (
        <ul className={styles.participantList}>
          {participants.map((participant) => (
            <li key={participant.id}>
              <div className={styles.participantIdentity}>
                <Link
                  href={`/recruitment/applicants/${participant.id}`}
                  className={styles.participantName}
                >
                  {participant.fullName}
                </Link>
                <span>{participant.email}</span>
              </div>
              <div className={styles.participantActions}>
                <span
                  className={
                    participant.meetingAttendance === "PRESENT"
                      ? styles.attendancePresent
                      : participant.meetingAttendance === "ABSENT"
                        ? styles.attendanceAbsent
                        : styles.attendancePending
                  }
                >
                  {participant.meetingAttendance === "PRESENT" ? (
                    <CheckCircle2 size={13} aria-hidden="true" />
                  ) : participant.meetingAttendance === "ABSENT" ? (
                    <XCircle size={13} aria-hidden="true" />
                  ) : null}
                  {participant.meetingAttendance === "PRESENT"
                    ? "Hadir"
                    : participant.meetingAttendance === "ABSENT"
                      ? "Tidak hadir"
                      : "Belum dicatat"}
                </span>
                <Link
                  href={`/recruitment/applicants/${participant.id}`}
                  className={styles.reviewLink}
                >
                  Buka detail
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noParticipants}>Belum ada calon yang memilih metode ini.</p>
      )}
    </details>
  );
}

export function RecruitmentMeetingsPage({
  initialOverview,
}: {
  initialOverview: MeetingOverview;
}) {
  const router = useRouter();
  const [zoomEnabled, setZoomEnabled] = useState(initialOverview.zoomEnabled);
  const [zoomUrl, setZoomUrl] = useState(initialOverview.zoomUrl);
  const [capacities, setCapacities] = useState(
    Object.fromEntries(
      initialOverview.sessions.map((session) => [session.id, session.capacity]),
    ),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submitJson(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: Record<string, unknown>,
  ) {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const result: unknown = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(result, "Perubahan gagal disimpan."));
    return result;
  }

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);
    const form = event.currentTarget;
    const values = new FormData(form);

    try {
      await submitJson("/api/recruitment-meetings", "POST", {
        title: values.get("title"),
        startsAt: values.get("startsAt"),
        endsAt: values.get("endsAt"),
        location: values.get("location"),
        capacity: Number(values.get("capacity")),
      });
      form.reset();
      setSuccess("Sesi pertemuan berhasil ditambahkan.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sesi pertemuan gagal ditambahkan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateSession(session: MeetingSession, form: HTMLFormElement) {
    setError("");
    setSuccess("");
    setIsSaving(true);
    const values = new FormData(form);
    try {
      await submitJson(`/api/recruitment-meetings/${session.id}`, "PATCH", {
        capacity: Number(values.get("capacity")),
        isActive: values.get("isActive") === "on",
      });
      setSuccess(`Pengaturan sesi "${session.title}" berhasil diperbarui.`);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Pengaturan sesi gagal diperbarui.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSession(session: MeetingSession) {
    if (!window.confirm(`Hapus sesi "${session.title}"?`)) return;
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      await submitJson(`/api/recruitment-meetings/${session.id}`, "DELETE");
      setSuccess("Sesi pertemuan berhasil dihapus.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sesi pertemuan gagal dihapus.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleZoomSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      await submitJson("/api/recruitment-meetings", "POST", {
        kind: "settings",
        zoomEnabled,
        zoomUrl,
      });
      setSuccess("Pengaturan pilihan Zoom berhasil disimpan.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Pengaturan Zoom gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/recruitment/applicants">
        <ArrowLeft size={17} aria-hidden="true" />
        Kembali ke data pendaftar
      </Link>

      <header className={styles.heading}>
        <span className={styles.eyebrow}>PENGELOLAAN REKRUTMEN</span>
        <h1>Jadwal pertemuan</h1>
        <p>
          Buat beberapa sesi tatap muka dan atur kapasitasnya. Calon anggota
          memilih sendiri sesi yang masih tersedia.
        </p>
      </header>

      {(error || success) && (
        <p className={error ? styles.error : styles.success} role={error ? "alert" : "status"}>
          {error || success}
        </p>
      )}

      <section className={styles.section} aria-labelledby="create-session-title">
        <div className={styles.sectionHeading}>
          <span className={styles.icon} aria-hidden="true">
            <Plus size={19} />
          </span>
          <div>
            <h2 id="create-session-title">Tambah sesi tatap muka</h2>
            <p>Waktu yang dimasukkan menggunakan zona waktu WIB.</p>
          </div>
        </div>
        <form className={styles.createForm} onSubmit={handleCreateSession}>
          <label>
            Nama sesi
            <input name="title" required maxLength={120} placeholder="Sesi pagi" />
          </label>
          <label>
            Waktu mulai
            <input name="startsAt" type="datetime-local" required />
          </label>
          <label>
            Waktu selesai
            <input name="endsAt" type="datetime-local" required />
          </label>
          <label>
            Lokasi
            <input name="location" required maxLength={240} placeholder="Ruang atau gedung" />
          </label>
          <label>
            Kapasitas
            <input name="capacity" type="number" min={1} max={500} defaultValue={20} required />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>
            <Plus size={16} aria-hidden="true" />
            {isSaving ? "Menyimpan..." : "Tambah sesi"}
          </button>
        </form>
      </section>

      <section className={styles.section} aria-labelledby="sessions-title">
        <div className={styles.sectionHeading}>
          <span className={styles.icon} aria-hidden="true">
            <CalendarDays size={19} />
          </span>
          <div>
            <h2 id="sessions-title">Sesi yang tersedia</h2>
            <p>Nonaktifkan sesi untuk menghentikan pilihan baru tanpa menghapus pilihan yang sudah dibuat.</p>
          </div>
        </div>
        {initialOverview.sessions.length ? (
          <div className={styles.sessionList}>
            {initialOverview.sessions.map((session) => (
              <article className={styles.sessionCard} key={session.id}>
                <div className={styles.sessionHeader}>
                  <div>
                    <h3>{session.title}</h3>
                    <p className={styles.sessionDate}>{formatSessionDate(session.startsAt)}</p>
                  </div>
                  <span className={session.isActive ? styles.activeBadge : styles.inactiveBadge}>
                    {session.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div className={styles.sessionMeta}>
                  <span>
                    <CalendarDays size={15} aria-hidden="true" />
                    {formatSessionTime(session.startsAt)}–{formatSessionTime(session.endsAt)} WIB
                  </span>
                  <span>
                    <MapPin size={15} aria-hidden="true" />
                    {session.location}
                  </span>
                  <span>
                    <UsersRound size={15} aria-hidden="true" />
                    {session.bookedCount} dari {session.capacity} orang
                  </span>
                </div>
                <ParticipantList
                  participants={session.applications}
                  label="Daftar peserta"
                />
                <form
                  className={styles.sessionActions}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleUpdateSession(session, event.currentTarget);
                  }}
                >
                  <label>
                    Kapasitas
                    <input
                      name="capacity"
                      type="number"
                      min={Math.max(1, session.bookedCount)}
                      max={500}
                      required
                      value={capacities[session.id] ?? session.capacity}
                      onChange={(event) =>
                        setCapacities((current) => ({
                          ...current,
                          [session.id]: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className={styles.activeToggle}>
                    <input name="isActive" type="checkbox" defaultChecked={session.isActive} />
                    Terima pilihan baru
                  </label>
                  <button type="submit" className={styles.secondaryButton} disabled={isSaving}>
                    <Save size={15} aria-hidden="true" /> Simpan
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    disabled={isSaving || session.bookedCount > 0}
                    onClick={() => void handleDeleteSession(session)}
                    aria-label={`Hapus ${session.title}`}
                    title={
                      session.bookedCount > 0
                        ? "Tidak dapat menghapus sesi yang sudah dipilih"
                        : "Hapus sesi"
                    }
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>Belum ada sesi. Tambahkan sesi pertama di atas.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="online-participants-title">
        <div className={styles.sectionHeading}>
          <span className={styles.icon} aria-hidden="true">
            <Video size={19} />
          </span>
          <div>
            <h2 id="online-participants-title">Peserta pertemuan online</h2>
            <p>Calon yang memilih pertemuan melalui Zoom.</p>
          </div>
        </div>
        <ParticipantList
          participants={initialOverview.onlineApplications}
          label="Daftar peserta Zoom"
        />
      </section>

      <section className={styles.section} aria-labelledby="zoom-title">
        <div className={styles.sectionHeading}>
          <span className={styles.icon} aria-hidden="true">
            <Video size={19} />
          </span>
          <div>
            <h2 id="zoom-title">Pilihan Zoom</h2>
            <p>
              Pilihan ini tersembunyi dari calon anggota sampai admin mengaktifkannya.
              Calon yang sudah memilih Zoom tetap dapat melihat tautannya.
            </p>
          </div>
        </div>
        <form className={styles.zoomForm} onSubmit={handleZoomSave}>
          <label className={styles.zoomToggle}>
            <span>
              <strong>Tampilkan pilihan Zoom</strong>
              <small>Aktifkan jika ada calon yang tidak bisa menghadiri sesi tatap muka.</small>
            </span>
            <input
              type="checkbox"
              checked={zoomEnabled}
              onChange={(event) => setZoomEnabled(event.target.checked)}
            />
          </label>
          <label className={styles.zoomUrl}>
            Tautan Zoom
            <input
              type="url"
              value={zoomUrl}
              onChange={(event) => setZoomUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>
            <Save size={16} aria-hidden="true" />
            {isSaving ? "Menyimpan..." : "Simpan pilihan Zoom"}
          </button>
        </form>
      </section>
    </main>
  );
}
