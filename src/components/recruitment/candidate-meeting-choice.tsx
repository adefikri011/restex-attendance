"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Video } from "lucide-react";
import type { ApplicantMeetingMode } from "@/generated/prisma/client";
import styles from "./candidate-meeting-choice.module.css";

type SessionOption = {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  location: string;
  capacity: number;
  bookedCount: number;
};

type MeetingData = {
  meetingMode: ApplicantMeetingMode | null;
  meetingSession: {
    id: string;
    title: string;
    startsAt: string | Date;
    endsAt: string | Date;
    location: string;
  } | null;
  sessions: SessionOption[];
  zoomEnabled: boolean;
  zoomUrl: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function CandidateMeetingChoice({ meeting }: { meeting: MeetingData }) {
  const router = useRouter();
  const [mode, setMode] = useState<ApplicantMeetingMode>(
    meeting.meetingMode ??
      (meeting.sessions.length ? "IN_PERSON" : "ONLINE"),
  );
  const [sessionId, setSessionId] = useState(
    meeting.meetingSession?.id ?? meeting.sessions[0]?.id ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selectedSession = meeting.sessions.find((session) => session.id === sessionId);
  const hasSavedChoice = Boolean(meeting.meetingMode);
  const zoomCanBeChosen = meeting.zoomEnabled;

  async function saveChoice() {
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/recruitment-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingMode: mode,
          ...(mode === "IN_PERSON" ? { meetingSessionId: sessionId } : {}),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Pilihan pertemuan gagal disimpan.",
        );
      }
      setSuccess("Pilihan pertemuan berhasil disimpan.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Pilihan pertemuan gagal disimpan. Coba lagi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="meeting-choice-title">
      <div className={styles.heading}>
        <span className={styles.icon} aria-hidden="true">
          <CalendarDays size={18} />
        </span>
        <div>
          <h2 id="meeting-choice-title">Pilih jadwal pertemuan</h2>
          <p>Pilih satu sesi yang sesuai. Waktu ditampilkan dalam WIB.</p>
        </div>
      </div>

      {meeting.meetingMode === "ONLINE" && meeting.zoomUrl ? (
        <div className={styles.savedOnline}>
          <Video size={18} aria-hidden="true" />
          <div>
            <strong>Pilihanmu: Pertemuan online</strong>
            <a href={meeting.zoomUrl} target="_blank" rel="noreferrer">
              Buka tautan Zoom
            </a>
          </div>
        </div>
      ) : meeting.meetingMode === "IN_PERSON" && meeting.meetingSession ? (
        <div className={styles.savedSession}>
          <strong>Pilihanmu: {meeting.meetingSession.title}</strong>
          <span>
            {formatDate(meeting.meetingSession.startsAt)},{" "}
            {formatTime(meeting.meetingSession.startsAt)}–{formatTime(meeting.meetingSession.endsAt)} WIB
          </span>
          <span><MapPin size={15} aria-hidden="true" />{meeting.meetingSession.location}</span>
        </div>
      ) : null}

      <div className={styles.options}>
        {meeting.sessions.map((session) => (
          <label
            className={`${styles.option} ${
              mode === "IN_PERSON" && sessionId === session.id ? styles.selected : ""
            }`}
            key={session.id}
          >
            <input
              type="radio"
              name="meeting-option"
              value={session.id}
              checked={mode === "IN_PERSON" && sessionId === session.id}
              onChange={() => {
                setMode("IN_PERSON");
                setSessionId(session.id);
              }}
            />
            <span className={styles.optionText}>
              <strong>{session.title}</strong>
              <span>{formatDate(session.startsAt)}</span>
              <span>
                {formatTime(session.startsAt)}–{formatTime(session.endsAt)} WIB
              </span>
              <span>{session.location}</span>
              <small>Sisa {session.capacity - session.bookedCount} tempat</small>
            </span>
          </label>
        ))}

        {zoomCanBeChosen && (
          <label
            className={`${styles.option} ${mode === "ONLINE" ? styles.selected : ""}`}
          >
            <input
              type="radio"
              name="meeting-option"
              value="ONLINE"
              checked={mode === "ONLINE"}
              onChange={() => setMode("ONLINE")}
            />
            <span className={styles.optionText}>
              <strong>Pertemuan via Zoom</strong>
              <span>Ikuti pertemuan secara online.</span>
            </span>
          </label>
        )}
      </div>

      {!meeting.sessions.length && !zoomCanBeChosen && (
        <p className={styles.empty}>
          Belum ada jadwal yang tersedia. Cek kembali nanti atau hubungi pengurus.
        </p>
      )}

      {mode === "ONLINE" && zoomCanBeChosen && meeting.zoomUrl && (
        <p className={styles.zoomNote}>
          Tautan Zoom akan tampil di portal setelah pilihan disimpan.
        </p>
      )}

      <button
        className={styles.saveButton}
        type="button"
        disabled={
          isSaving ||
          (mode === "IN_PERSON" && !selectedSession) ||
          (mode === "ONLINE" &&
            !zoomCanBeChosen &&
            meeting.meetingMode !== "ONLINE")
        }
        onClick={() => void saveChoice()}
      >
        {isSaving ? "Menyimpan..." : hasSavedChoice ? "Ubah pilihan pertemuan" : "Simpan pilihan"}
      </button>
      {(error || success) && (
        <p className={error ? styles.error : styles.success} role={error ? "alert" : "status"}>
          {error || success}
        </p>
      )}
    </section>
  );
}
