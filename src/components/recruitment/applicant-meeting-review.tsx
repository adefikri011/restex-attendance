"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApplicantMeetingAttendance } from "@/generated/prisma/client";
import styles from "./recruitment-applicant-detail-page.module.css";

const attendanceOptions: {
  value: ApplicantMeetingAttendance | "";
  label: string;
}[] = [
  { value: "", label: "Belum dicatat" },
  { value: "PRESENT", label: "Hadir" },
  { value: "ABSENT", label: "Tidak hadir" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function ApplicantMeetingReview({
  applicationId,
  initialAttendance,
  initialNotes,
  editable,
}: {
  applicationId: string;
  initialAttendance: ApplicantMeetingAttendance | null;
  initialNotes: string | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [attendance, setAttendance] = useState<ApplicantMeetingAttendance | "">(
    initialAttendance ?? "",
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isDirty =
    attendance !== (initialAttendance ?? "") || notes !== (initialNotes ?? "");

  async function saveReview() {
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/recruitment-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingAttendance: attendance || null,
          meetingNotes: notes,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Hasil pertemuan gagal disimpan.",
        );
      }
      setSuccess("Kehadiran dan catatan pertemuan berhasil disimpan.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Hasil pertemuan gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!editable) {
    return (
      <div className={styles.meetingReviewReadOnly}>
        <p>
          Kehadiran:{" "}
          <strong>
            {attendanceOptions.find(({ value }) => value === initialAttendance)?.label ??
              "Belum dicatat"}
          </strong>
        </p>
        <p>
          Catatan wawancara: <strong>{initialNotes || "Belum ada catatan"}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.meetingReview}>
      <label>
        Kehadiran pertemuan
        <select
          value={attendance}
          onChange={(event) =>
            setAttendance(event.target.value as ApplicantMeetingAttendance | "")
          }
          disabled={isSaving}
        >
          {attendanceOptions.map((option) => (
            <option key={option.value || "unrecorded"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.meetingNotesLabel}>
        Catatan hasil wawancara
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={3000}
          rows={4}
          placeholder="Catat poin penting dan tindak lanjut..."
          disabled={isSaving}
        />
        <span>{notes.length}/3000 karakter</span>
      </label>
      <button
        type="button"
        className={styles.saveStatusButton}
        disabled={isSaving || !isDirty}
        onClick={() => void saveReview()}
      >
        {isSaving ? "Menyimpan..." : "Simpan hasil pertemuan"}
      </button>
      {(error || success) && (
        <p
          className={error ? styles.actionError : styles.actionSuccess}
          role={error ? "alert" : "status"}
        >
          {error || success}
        </p>
      )}
    </div>
  );
}
