"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
import type { ApplicantDecision, ApplicantStage } from "@/generated/prisma/client";
import styles from "./recruitment-applicant-detail-page.module.css";

const stages: { value: ApplicantStage; label: string }[] = [
  { value: "SUBMITTED", label: "Pendaftaran masuk" },
  { value: "SCREENING", label: "Screening" },
  { value: "MEETING_INVITED", label: "Diundang pertemuan" },
  { value: "FORM_TWO_OPEN", label: "Formulir lanjutan dibuka" },
  { value: "FORM_TWO_SUBMITTED", label: "Formulir lanjutan dikirim" },
  { value: "FINAL_REVIEW", label: "Tinjauan akhir" },
];

const decisions: { value: ApplicantDecision; label: string }[] = [
  { value: "ACCEPTED", label: "Diterima" },
  { value: "WAITLISTED", label: "Daftar tunggu" },
  { value: "REJECTED", label: "Tidak diterima" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function ApplicantScreeningActions({
  applicationId,
  stage,
  decision,
}: {
  applicationId: string;
  stage: ApplicantStage;
  decision: ApplicantDecision | null;
}) {
  const router = useRouter();
  const initialChoice = decision ? `decision:${decision}` : `stage:${stage}`;
  const [choice, setChoice] = useState(initialChoice);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);
    const [kind, value] = choice.split(":");
    const body =
      kind === "decision"
        ? { stage: "FINAL_REVIEW", decision: value }
        : { stage: value, decision: null };

    try {
      const response = await fetch(`/api/recruitment-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Tahap seleksi gagal diperbarui.",
        );
      }
      setSuccess("Tahap seleksi berhasil diperbarui.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Tahap seleksi gagal diperbarui. Coba lagi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.screeningForm} onSubmit={handleSubmit} aria-busy={isSaving}>
      <label>
        Tahap seleksi atau hasil
        <select value={choice} onChange={(event) => setChoice(event.target.value)}>
          <optgroup label="Tahap seleksi">
            {stages.map((item) => (
              <option key={item.value} value={`stage:${item.value}`}>
                {item.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Hasil seleksi">
            {decisions.map((item) => (
              <option key={item.value} value={`decision:${item.value}`}>
                {item.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <button type="submit" className={styles.saveStatusButton} disabled={isSaving}>
        {isSaving ? (
          <LoaderCircle size={16} className={styles.spinner} aria-hidden="true" />
        ) : (
          <Check size={16} aria-hidden="true" />
        )}
        {isSaving ? "Menyimpan..." : "Simpan tahap"}
      </button>
      {(error || success) && (
        <p className={error ? styles.actionError : styles.actionSuccess} role={error ? "alert" : "status"}>
          {error || success}
        </p>
      )}
    </form>
  );
}
