import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Mail,
  UserRound,
} from "lucide-react";
import type {
  ApplicantDecision,
  ApplicantMeetingAttendance,
  ApplicantScreeningRating,
  ApplicantStage,
} from "@/generated/prisma/client";
import { ApplicantMeetingReview } from "./applicant-meeting-review";
import { ApplicantScreeningActions } from "./applicant-screening-actions";
import { ApplicantScreeningRating as ApplicantScreeningRatingControl } from "./applicant-screening-rating";
import styles from "./recruitment-applicant-detail-page.module.css";

const stageLabels: Record<ApplicantStage, string> = {
  SUBMITTED: "Pendaftaran masuk",
  SCREENING: "Screening",
  MEETING_INVITED: "Diundang pertemuan",
  FORM_TWO_OPEN: "Formulir lanjutan dibuka",
  FORM_TWO_SUBMITTED: "Formulir lanjutan dikirim",
  FINAL_REVIEW: "Tinjauan akhir",
};

const decisionLabels: Record<ApplicantDecision, string> = {
  ACCEPTED: "Diterima",
  REJECTED: "Tidak diterima",
  WAITLISTED: "Daftar tunggu",
};

type Application = {
  id: string;
  fullName: string;
  nim: string;
  email: string;
  studyProgram: { name: string };
  cohort: string;
  motivation: string | null;
  stage: ApplicantStage;
  decision: ApplicantDecision | null;
  screeningRating: ApplicantScreeningRating | null;
  meetingMode: "IN_PERSON" | "ONLINE" | null;
  meetingAttendance: ApplicantMeetingAttendance | null;
  meetingNotes: string | null;
  meetingSession: {
    title: string;
    startsAt: Date;
    endsAt: Date;
    location: string;
  } | null;
  division: string | null;
  divisionReason: string | null;
  experience: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatMeetingTime(startsAt: Date, endsAt: Date) {
  const date = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  }).format(startsAt);
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  });
  return `${date}, ${time.format(startsAt)}–${time.format(endsAt)} WIB`;
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailIcon} aria-hidden="true">
        <Icon size={17} />
      </span>
      <div>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </div>
    </div>
  );
}

export function RecruitmentApplicantDetailPage({
  application,
}: {
  application: Application;
}) {
  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/recruitment/applicants">
        <ArrowLeft size={17} aria-hidden="true" />
        Kembali ke daftar pendaftar
      </Link>

      <header className={styles.heading}>
        <span className={styles.eyebrow}>DETAIL PENDAFTAR</span>
        <div className={styles.titleRow}>
          <div>
            <h1>{application.fullName}</h1>
            <p>NIM {application.nim}</p>
          </div>
          <span className={styles.stage}>
            {application.decision
              ? decisionLabels[application.decision]
              : stageLabels[application.stage]}
          </span>
        </div>
      </header>

      <section className={styles.card} aria-labelledby="identity-title">
        <div className={styles.sectionHeading}>
          <UserRound size={19} aria-hidden="true" />
          <h2 id="identity-title">Data pendaftaran</h2>
        </div>
        <dl className={styles.detailGrid}>
          <DetailItem icon={UserRound} label="Nama lengkap" value={application.fullName} />
          <DetailItem icon={Mail} label="Email aktif" value={application.email} />
          <DetailItem icon={GraduationCap} label="Program studi" value={application.studyProgram.name} />
          <DetailItem icon={GraduationCap} label="Angkatan" value={application.cohort} />
          <DetailItem icon={CalendarDays} label="Waktu pendaftaran" value={formatDate(application.createdAt)} />
          <DetailItem icon={CalendarDays} label="Terakhir diperbarui" value={formatDate(application.updatedAt)} />
        </dl>
      </section>

      <section className={styles.card} aria-labelledby="motivation-title">
        <div className={styles.sectionHeading}>
          <UserRound size={19} aria-hidden="true" />
          <h2 id="motivation-title">Alasan memilih UKM RESTEX</h2>
        </div>
        <p className={styles.motivation}>
          {application.motivation || "Belum diisi"}
        </p>
      </section>

      <section className={styles.card} aria-labelledby="screening-title">
        <div className={styles.sectionHeading}>
          <ClipboardCheck size={19} aria-hidden="true" />
          <h2 id="screening-title">Screening dan status seleksi</h2>
        </div>
        <p className={styles.actionDescription}>
          Perbarui tahap calon anggota. Saat hasil dipilih, hasil langsung tersedia
          di portal calon anggota.
        </p>
        <ApplicantScreeningActions
          applicationId={application.id}
          stage={application.stage}
          decision={application.decision}
        />
        <ApplicantScreeningRatingControl
          applicationId={application.id}
          initialRating={application.screeningRating}
          editable={
            application.decision === null &&
            (application.stage === "SUBMITTED" || application.stage === "SCREENING")
          }
        />
      </section>

      {application.meetingMode && (
        <section className={styles.card} aria-labelledby="meeting-title">
          <div className={styles.sectionHeading}>
            <CalendarDays size={19} aria-hidden="true" />
            <h2 id="meeting-title">Pilihan pertemuan calon</h2>
          </div>
          {application.meetingMode === "ONLINE" ? (
            <p className={styles.motivation}>Calon memilih pertemuan via Zoom.</p>
          ) : application.meetingSession ? (
            <dl className={styles.stageTwoGrid}>
              <div>
                <dt>Sesi</dt>
                <dd>{application.meetingSession.title}</dd>
              </div>
              <div>
                <dt>Jadwal</dt>
                <dd>
                  {formatMeetingTime(
                    application.meetingSession.startsAt,
                    application.meetingSession.endsAt,
                  )}
                </dd>
              </div>
              <div>
                <dt>Lokasi</dt>
                <dd>{application.meetingSession.location}</dd>
              </div>
            </dl>
          ) : (
            <p className={styles.motivation}>Pilihan sesi belum tersedia.</p>
          )}
          <div className={styles.meetingReviewHeading}>
            <h3>Presensi dan catatan wawancara</h3>
            <p>Informasi internal untuk tim seleksi.</p>
          </div>
          <ApplicantMeetingReview
            applicationId={application.id}
            initialAttendance={application.meetingAttendance}
            initialNotes={application.meetingNotes}
            editable={application.decision === null}
          />
        </section>
      )}

      <section className={styles.card} aria-labelledby="next-stage-title">
        <div className={styles.sectionHeading}>
          <GraduationCap size={19} aria-hidden="true" />
          <h2 id="next-stage-title">Formulir tahap lanjutan</h2>
        </div>
        <dl className={styles.stageTwoGrid}>
          <div>
            <dt>Pilihan divisi</dt>
            <dd>{application.division || "Belum diisi"}</dd>
          </div>
          <div>
            <dt>Alasan memilih divisi</dt>
            <dd>{application.divisionReason || "Belum diisi"}</dd>
          </div>
          <div>
            <dt>Pengalaman</dt>
            <dd>{application.experience || "Belum diisi"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
