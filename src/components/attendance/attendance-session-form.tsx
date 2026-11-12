"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  activityTypes,
  isAttendanceSession,
  type ActivityType,
  type AttendanceSession,
} from "./attendance-data";
import styles from "./attendance.module.css";
import { notifications } from "@/lib/notifications";

type AttendanceSessionFormProps = {
  onCancel: () => void;
  onCreated: (session: AttendanceSession) => void;
};

function getToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function AttendanceSessionForm({
  onCancel,
  onCreated,
}: AttendanceSessionFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ActivityType>("Rutin");
  const [date, setDate] = useState(getToday);
  const [time, setTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, date, time, location, notes }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        notifications.error(
          "Sesi absensi gagal dibuka",
          typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
            ? result.error
            : "Sesi gagal dibuka.",
        );
        return;
      }
      if (typeof result !== "object" || result === null || !("session" in result) || !isAttendanceSession(result.session)) {
        throw new Error("Respons pembukaan sesi tidak valid.");
      }
      onCreated(result.session);
    } catch (caught) {
      notifications.error(
        "Sesi absensi gagal dibuka",
        caught instanceof Error
          ? caught.message
          : "Layanan sesi tidak dapat dihubungi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.sessionFormPanel} aria-labelledby="create-session-title">
      <header className={styles.sessionFormHeading}>
        <div>
          <span className={styles.panelEyebrow}>SESI BARU · DIVISI</span>
          <h2 id="create-session-title">Buka sesi absensi</h2>
          <p>Sesi langsung aktif setelah dibuat dan siap menerima scan QR.</p>
        </div>
        <button
          type="button"
          className={styles.formCloseButton}
          aria-label="Tutup form sesi"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X size={17} aria-hidden="true" />
        </button>
      </header>
      <form className={styles.sessionForm} onSubmit={handleSubmit}>
        <label>
          Nama kegiatan
          <input
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contoh: Rapat rutin divisi"
          />
        </label>
        <label>
          Jenis kegiatan
          <select value={type} onChange={(event) => setType(event.target.value as ActivityType)}>
            {activityTypes.map((activityType) => (
              <option value={activityType} key={activityType}>{activityType}</option>
            ))}
          </select>
        </label>
        <label>
          Tanggal
          <input required type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          Waktu mulai
          <input required type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </label>
        <label>
          Lokasi
          <input
            required
            minLength={2}
            maxLength={160}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Contoh: Sekretariat RESTEX"
          />
        </label>
        <label className={styles.sessionNotesField}>
          Catatan <span>(opsional)</span>
          <textarea
            maxLength={1000}
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Agenda atau informasi tambahan"
          />
        </label>
        <div className={styles.sessionFormFooter}>
          <p>Operator yang membuka sesi akan tercatat otomatis.</p>
          <div>
            <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className={styles.createButton} disabled={isSubmitting}>
              {isSubmitting ? "Membuka sesi..." : "Buka sesi & scan"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
