"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/auth/turnstile-widget";
import { StudyProgramField } from "@/components/recruitment/study-program-field";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  normalizeStudyProgramName,
  recruitmentApplicationFormSchema,
} from "@/lib/recruitment-application-schema";
import styles from "./application-form.module.css";

export function ApplicationForm() {
  const [feedback, setFeedback] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmedProgram, setConfirmedProgram] = useState<string | null>(null);
  const [motivationLength, setMotivationLength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsedForm = recruitmentApplicationFormSchema.safeParse(
      Object.fromEntries(formData),
    );
    if (!parsedForm.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsedForm.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      setFeedback("Periksa kembali data yang ditandai pada formulir.");
      const firstInvalidField = Object.keys(errors)[0];
      if (firstInvalidField) {
        form.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)?.focus();
      }
      return;
    }
    setFieldErrors({});

    if (
      !confirmedProgram ||
      normalizeStudyProgramName(confirmedProgram) !==
        normalizeStudyProgramName(parsedForm.data.program)
    ) {
      setFieldErrors({ program: "Pilih program yang tersedia atau klik Tambah." });
      setFeedback("Pilih atau tambahkan jurusan/program studi terlebih dahulu.");
      form.querySelector<HTMLElement>('[name="program"]')?.focus();
      return;
    }

    const requiresCaptcha =
      process.env.NODE_ENV === "production" ||
      Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
    if (requiresCaptcha && !captchaToken) {
      setFeedback("Selesaikan verifikasi keamanan sebelum mengirim pendaftaran.");
      return;
    }

    setIsSubmitting(true);
    let registrationRequestStarted = false;
    try {
      registrationRequestStarted = true;
      const response = await fetch("/api/recruitment-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsedForm.data,
          captchaToken,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Pendaftaran gagal dikirim. Silakan coba kembali.";
        throw new Error(message);
      }

      setIsSubmitted(true);
      form.reset();
      setCaptchaToken(null);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Layanan pendaftaran tidak dapat dihubungi. Silakan coba lagi.",
      );
      if (registrationRequestStarted) {
        setCaptchaToken(null);
        turnstileRef.current?.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <section
        className={`${styles.panel} ${styles.successPanel}`}
        aria-labelledby="application-success-title"
        aria-live="polite"
      >
        <div className={styles.successMark} aria-hidden="true">
          <CheckCircle2 size={28} strokeWidth={1.8} />
        </div>
        <p className={styles.successKicker}>FORMULIR TERKIRIM</p>
        <div className={styles.success}>
          <h2 id="application-success-title">Pendaftaran berhasil dikirim</h2>
          <p>
            Pendaftaranmu akan masuk ke tahap screening. Masuk ke akun Calon
            Anggota untuk melihat perkembangan tahapan seleksi dan pengumuman.
          </p>
          <div className={styles.nextStep}>
            <span className={styles.nextStepMarker}>02</span>
            <span>
              <small>LANGKAH BERIKUTNYA</small>
              <strong>Pantau akun Calon Anggota</strong>
              <small>
                Gunakan email dan kata sandi yang didaftarkan. Email belum
                diverifikasi karena layanan pengiriman email belum disiapkan.
              </small>
            </span>
          </div>
          <Link className={styles.submitButton} href="/login">
            Masuk untuk melihat tahapan <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-labelledby="application-form-title">
      <div className={styles.panelHeading}>
        <div className={styles.formProgress}>
          <span>LANGKAH 01</span>
          <span className={styles.progressTrack}><span /></span>
          <span>DATA DIRI</span>
        </div>
        <h2 id="application-form-title">Lengkapi data awal</h2>
        <p>Isi identitas dan buat akun Calon Anggota untuk memantau proses seleksi.</p>
      </div>

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="applicant-name">Nama lengkap</label>
          <input
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "applicant-name-error" : undefined}
            id="applicant-name"
            maxLength={160}
            name="name"
            onChange={() => {
              setFieldErrors((current) => ({ ...current, name: "" }));
              setFeedback("");
            }}
            placeholder="Nama sesuai identitas"
            required
          />
          {fieldErrors.name && <small className={styles.fieldError} id="applicant-name-error">{fieldErrors.name}</small>}
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="applicant-nim">NIM</label>
            <input
              aria-invalid={Boolean(fieldErrors.nim)}
              aria-describedby={fieldErrors.nim ? "applicant-nim-error" : undefined}
              autoComplete="off"
              id="applicant-nim"
              inputMode="numeric"
              maxLength={32}
              name="nim"
              onChange={() => {
                setFieldErrors((current) => ({ ...current, nim: "" }));
                setFeedback("");
              }}
              placeholder="Nomor induk mahasiswa"
              required
            />
            {fieldErrors.nim && <small className={styles.fieldError} id="applicant-nim-error">{fieldErrors.nim}</small>}
          </div>
          <div className={styles.field}>
            <label htmlFor="applicant-email">Email aktif</label>
            <input
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "applicant-email-error" : undefined}
              autoComplete="email"
              id="applicant-email"
              maxLength={254}
              name="email"
              onChange={() => {
                setFieldErrors((current) => ({ ...current, email: "" }));
                setFeedback("");
              }}
              placeholder="nama@email.com"
              required
              type="email"
            />
            {fieldErrors.email && <small className={styles.fieldError} id="applicant-email-error">{fieldErrors.email}</small>}
          </div>
        </div>

        <div className={styles.fieldGrid}>
          <StudyProgramField
            fieldError={fieldErrors.program}
            captchaToken={captchaToken}
            onCaptchaConsumed={() => {
              setCaptchaToken(null);
              turnstileRef.current?.reset();
            }}
            onValueChange={() => {
              setConfirmedProgram(null);
              setFieldErrors((current) => ({ ...current, program: "" }));
              setFeedback("");
            }}
            onConfirmed={setConfirmedProgram}
          />
          <div className={styles.field}>
            <label htmlFor="applicant-cohort">Angkatan (tahun masuk)</label>
            <input
              aria-invalid={Boolean(fieldErrors.cohort)}
              aria-describedby={fieldErrors.cohort ? "applicant-cohort-error" : undefined}
              autoComplete="off"
              id="applicant-cohort"
              inputMode="numeric"
              maxLength={4}
              name="cohort"
              onChange={() => {
                setFieldErrors((current) => ({ ...current, cohort: "" }));
                setFeedback("");
              }}
              pattern="[0-9]{4}"
              placeholder="Contoh: 2026"
              required
              type="text"
            />
            {fieldErrors.cohort && <small className={styles.fieldError} id="applicant-cohort-error">{fieldErrors.cohort}</small>}
          </div>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="applicant-password">Buat kata sandi</label>
            <input
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "applicant-password-error" : undefined}
              autoComplete="new-password"
              id="applicant-password"
              maxLength={128}
              minLength={12}
              name="password"
              onChange={() => {
                setFieldErrors((current) => ({ ...current, password: "" }));
                setFeedback("");
              }}
              placeholder="Minimal 12 karakter"
              required
              type="password"
            />
            {fieldErrors.password && <small className={styles.fieldError} id="applicant-password-error">{fieldErrors.password}</small>}
          </div>
          <div className={styles.field}>
            <label htmlFor="applicant-password-confirmation">
              Konfirmasi kata sandi
            </label>
            <input
              aria-invalid={Boolean(fieldErrors.passwordConfirmation)}
              aria-describedby={fieldErrors.passwordConfirmation ? "applicant-password-confirmation-error" : undefined}
              autoComplete="new-password"
              id="applicant-password-confirmation"
              maxLength={128}
              minLength={12}
              name="passwordConfirmation"
              onChange={() => {
                setFieldErrors((current) => ({ ...current, passwordConfirmation: "" }));
                setFeedback("");
              }}
              placeholder="Masukkan kembali kata sandi"
              required
              type="password"
            />
            {fieldErrors.passwordConfirmation && <small className={styles.fieldError} id="applicant-password-confirmation-error">{fieldErrors.passwordConfirmation}</small>}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="applicant-motivation">
            Alasan memilih UKM RESTEX
          </label>
          <textarea
            aria-describedby={
              fieldErrors.motivation
                ? "applicant-motivation-help applicant-motivation-error"
                : "applicant-motivation-help"
            }
            aria-invalid={Boolean(fieldErrors.motivation)}
            id="applicant-motivation"
            maxLength={1000}
            minLength={20}
            name="motivation"
            onChange={(event) => {
              setMotivationLength(event.target.value.length);
              setFieldErrors((current) => ({ ...current, motivation: "" }));
              setFeedback("");
            }}
            placeholder="Ceritakan alasanmu ingin bergabung dengan UKM RESTEX"
            required
            rows={5}
          />
          <small id="applicant-motivation-help">
            Tulis 20 sampai 1000 karakter. Alasan ini berbeda dari pilihan divisi
            pada formulir tahap lanjutan.
          </small>
          <small aria-live="polite">
            {motivationLength}/1000 karakter
          </small>
          {fieldErrors.motivation && (
            <small
              className={styles.fieldError}
              id="applicant-motivation-error"
              role="alert"
            >
              {fieldErrors.motivation}
            </small>
          )}
        </div>

        <p className={styles.notice}>
          Data pendaftaran disimpan untuk proses seleksi. Email belum
          diverifikasi; akses akun memakai kata sandi yang kamu buat.
        </p>

        <TurnstileWidget
          ref={turnstileRef}
          action="registration"
          onTokenChange={setCaptchaToken}
        />

        {feedback && (
          <p className={styles.feedback} role="alert">
            {feedback}
          </p>
        )}

        <button
          className={styles.submitButton}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Mengirim pendaftaran..." : "Kirim pendaftaran"}
        </button>
      </form>
    </section>
  );
}
