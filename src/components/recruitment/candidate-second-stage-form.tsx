"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ClipboardList, Send } from "lucide-react";
import styles from "./candidate-second-stage-form.module.css";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function CandidateSecondStageForm({
  divisions,
  initialValues,
}: {
  divisions: string[];
  initialValues: {
    division: string;
    divisionReason: string;
    experience: string;
  };
}) {
  const router = useRouter();
  const [division, setDivision] = useState(initialValues.division);
  const [divisionReason, setDivisionReason] = useState(initialValues.divisionReason);
  const [experience, setExperience] = useState(initialValues.experience);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/recruitment-applications/second-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ division, divisionReason, experience }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Formulir lanjutan gagal dikirim.",
        );
      }
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Formulir lanjutan gagal dikirim.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="second-stage-title">
      <div className={styles.heading}>
        <span className={styles.icon} aria-hidden="true">
          <ClipboardList size={19} />
        </span>
        <div>
          <h2 id="second-stage-title">Formulir lanjutan</h2>
          <p>Lengkapi pilihan divisi dan pengalamanmu sebelum mengirim.</p>
        </div>
      </div>
      <form className={styles.form} onSubmit={submitForm}>
        <label>
          Divisi yang diminati
          <select
            value={division}
            onChange={(event) => setDivision(event.target.value)}
            required
            disabled={isSubmitting || !divisions.length}
          >
            <option value="">Pilih divisi</option>
            {divisions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Alasan memilih divisi
          <textarea
            value={divisionReason}
            onChange={(event) => setDivisionReason(event.target.value)}
            minLength={20}
            maxLength={1500}
            rows={4}
            required
            disabled={isSubmitting}
            placeholder="Ceritakan hal yang membuatmu tertarik dengan divisi ini."
          />
          <span>{divisionReason.length}/1500 karakter</span>
        </label>
        <label>
          Pengalaman atau keterampilan yang relevan
          <textarea
            value={experience}
            onChange={(event) => setExperience(event.target.value)}
            maxLength={2000}
            rows={4}
            disabled={isSubmitting}
            placeholder="Boleh dikosongkan jika belum ada pengalaman."
          />
          <span>{experience.length}/2000 karakter</span>
        </label>
        {divisions.length === 0 && (
          <p className={styles.error}>
            Pilihan divisi belum tersedia. Hubungi pengurus RESTEX.
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isSubmitting || !divisions.length}
        >
          <Send size={16} aria-hidden="true" />
          {isSubmitting ? "Mengirim..." : "Kirim formulir"}
        </button>
      </form>
    </section>
  );
}
