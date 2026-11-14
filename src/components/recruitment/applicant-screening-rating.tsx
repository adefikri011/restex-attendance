"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ApplicantScreeningRating as ApplicantScreeningRatingValue,
} from "@/generated/prisma/client";
import styles from "./recruitment-applicant-detail-page.module.css";

const ratings: { value: ApplicantScreeningRatingValue | ""; label: string }[] = [
  { value: "", label: "Belum dinilai" },
  { value: "RECOMMENDED", label: "Direkomendasikan" },
  { value: "CONSIDER", label: "Layak dipertimbangkan" },
  { value: "NOT_RECOMMENDED", label: "Belum direkomendasikan" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function ApplicantScreeningRating({
  applicationId,
  initialRating,
  editable,
}: {
  applicationId: string;
  initialRating: ApplicantScreeningRatingValue | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState<ApplicantScreeningRatingValue | "">(
    initialRating ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!editable) {
    return (
      <p className={styles.savedRating}>
        Penilaian internal:{" "}
        <strong>
          {initialRating
            ? ratings.find(({ value }) => value === initialRating)?.label
            : "Belum dinilai"}
        </strong>
      </p>
    );
  }

  async function saveRating() {
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/recruitment-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screeningRating: rating || null }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Penilaian screening gagal disimpan.",
        );
      }
      setSuccess("Penilaian screening berhasil disimpan.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Penilaian screening gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.ratingForm}>
      <label>
        Hasil penilaian internal
        <select
          value={rating}
          onChange={(event) =>
            setRating(event.target.value as ApplicantScreeningRatingValue | "")
          }
        >
          {ratings.map((item) => (
            <option key={item.value || "unrated"} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={styles.saveStatusButton}
        disabled={isSaving || rating === (initialRating ?? "")}
        onClick={() => void saveRating()}
      >
        {isSaving ? "Menyimpan..." : "Simpan penilaian"}
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
