"use client";

import { ChevronDown, Plus } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import styles from "./application-form.module.css";
import { saveStudyProgram } from "@/lib/study-program-client";
import { normalizeStudyProgramName } from "@/lib/recruitment-application-schema";

type StudyProgram = { id: string; name: string };

export function StudyProgramField({
  fieldError,
  onValueChange,
  captchaToken,
  onCaptchaConsumed,
  onConfirmed,
}: {
  fieldError?: string;
  onValueChange: () => void;
  captchaToken: string | null;
  onCaptchaConsumed: () => void;
  onConfirmed: (name: string) => void;
}) {
  const [value, setValue] = useState("");
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmedName, setConfirmedName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = value.trim();
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/study-programs?q=${encodeURIComponent(query)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const result: unknown = await response.json();
        if (
          typeof result !== "object" ||
          result === null ||
          !response.ok ||
          !("programs" in result) ||
          !Array.isArray(result.programs) ||
          !result.programs.every(
            (program) =>
              typeof program === "object" &&
              program !== null &&
              "id" in program &&
              typeof program.id === "string" &&
              "name" in program &&
              typeof program.name === "string",
          )
        ) {
          throw new Error(
            typeof result === "object" &&
              result !== null &&
              "error" in result &&
              typeof result.error === "string"
              ? result.error
              : "Daftar program studi gagal dimuat.",
          );
        }
        setPrograms(result.programs);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Daftar program studi gagal dimuat.",
        );
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  async function addProgram() {
    const name = value.trim().replace(/\s+/g, " ");
    if (!name || isSaving) return;

    const existing = programs.find(
      (program) =>
        normalizeStudyProgramName(program.name) === normalizeStudyProgramName(name),
    );
    if (existing) {
      setValue(existing.name);
      setConfirmedName(existing.name);
      setIsOpen(false);
      onConfirmed(existing.name);
      setError("");
      setMessage("Program studi sudah tersedia dan dipilih.");
      return;
    }

    const requiresCaptcha =
      process.env.NODE_ENV === "production" ||
      Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
    if (requiresCaptcha && !captchaToken) {
      setError("Selesaikan CAPTCHA terlebih dahulu, lalu tekan tombol Tambah.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");
    let requestStarted = false;
    try {
      requestStarted = true;
      const savedName = await saveStudyProgram(name, captchaToken);
      onCaptchaConsumed();
      setValue(savedName);
      setConfirmedName(savedName);
      setIsOpen(false);
      onConfirmed(savedName);
      setPrograms((current) => {
        const withoutDuplicate = current.filter(
          (program) =>
            normalizeStudyProgramName(program.name) !==
            normalizeStudyProgramName(savedName),
        );
        return [
          {
            id: `new-${normalizeStudyProgramName(savedName)}`,
            name: savedName,
          },
          ...withoutDuplicate,
        ];
      });
      setMessage(
        `"${savedName}" ditambahkan. Selesaikan CAPTCHA lagi untuk mengirim formulir.`,
      );
    } catch (requestError) {
      if (requestStarted) onCaptchaConsumed();
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Program studi gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      return;
    }
    if (event.key === "Escape") setIsOpen(false);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsOpen(false);
    }
  }

  function selectProgram(program: StudyProgram) {
    setValue(program.name);
    setConfirmedName(program.name);
    setError("");
    setMessage("");
    setIsOpen(false);
    onValueChange();
    onConfirmed(program.name);
  }

  const normalizedValue = normalizeStudyProgramName(value);
  const existingProgram = programs.find(
    (program) =>
      normalizeStudyProgramName(program.name) === normalizedValue,
  );

  return (
    <div
      className={`${styles.field} ${styles.programField}`}
      ref={fieldRef}
      onBlur={handleBlur}
    >
      <label htmlFor="applicant-program">Jurusan / program studi</label>
      <div className={styles.programInputRow}>
        <input
          autoComplete="organization-title"
          aria-autocomplete="list"
          aria-controls="applicant-program-options"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          id="applicant-program"
          maxLength={160}
          name="program"
          onChange={(event) => {
            setValue(event.target.value);
            setConfirmedName(null);
            setError("");
            setMessage("");
            setIsOpen(true);
            onValueChange();
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Pilih atau ketik program studi"
          required
          role="combobox"
          value={value}
          aria-invalid={Boolean(error || fieldError)}
          aria-describedby="applicant-program-help applicant-program-error"
        />
        <button
          className={styles.programDropdownButton}
          aria-label={isOpen ? "Tutup pilihan program studi" : "Buka pilihan program studi"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <ChevronDown size={18} aria-hidden="true" />
        </button>
      </div>
      {isOpen && (
        <div
          className={styles.programSuggestions}
          id="applicant-program-options"
          role="listbox"
          aria-label="Pilihan program studi"
        >
          {programs.map((program) => (
            <button
              className={styles.programOption}
              key={program.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectProgram(program)}
              role="option"
              aria-selected={confirmedName === program.name}
              type="button"
            >
              {program.name}
            </button>
          ))}
          {value.trim() && !existingProgram && (
            <button
              className={`${styles.programOption} ${styles.programCreateOption}`}
              disabled={isSaving}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void addProgram()}
              role="option"
              aria-selected={false}
              type="button"
            >
              <Plus size={16} aria-hidden="true" />
              <span>
                {isSaving ? "Menyimpan..." : `Tambah "${value.trim()}"`}
              </span>
            </button>
          )}
          {programs.length === 0 && !value.trim() && (
            <p className={styles.programEmpty}>Belum ada program studi. Ketik nama untuk menambahkannya.</p>
          )}
          {programs.length === 0 && value.trim() && !isSaving && !error && (
            <p className={styles.programEmpty}>Nama ini belum ada. Pilih opsi tambah di atas.</p>
          )}
          {error && (
            <p className={styles.programMenuError} role="alert">
              {error}
            </p>
          )}
        </div>
      )}
      <small id="applicant-program-help">
        Pilih dari daftar atau ketik nama baru, lalu pilih opsi Tambah.
      </small>
      {confirmedName && (
        <small className={styles.fieldSuccess} role="status">
          Program studi dipilih: {confirmedName}
        </small>
      )}
      {message && !confirmedName && (
        <small className={styles.fieldSuccess} role="status">{message}</small>
      )}
      {(error || fieldError) && (
        <small className={styles.fieldError} id="applicant-program-error" role="alert">
          {error || fieldError}
        </small>
      )}
    </div>
  );
}
