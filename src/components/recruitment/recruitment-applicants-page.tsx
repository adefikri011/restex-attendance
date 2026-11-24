"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Megaphone, Search, Send, UsersRound } from "lucide-react";
import type {
  ApplicantDecision,
  ApplicantScreeningRating,
  ApplicantStage,
} from "@/generated/prisma/client";
import type { ApplicantRatingFilter } from "@/lib/recruitment-applicant-service";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import styles from "./recruitment-applicants-page.module.css";

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

const decisionStyles: Record<ApplicantDecision, string> = {
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WAITLISTED: "waitlisted",
};

const stageStyles: Record<ApplicantStage, string> = {
  SUBMITTED: "submitted",
  SCREENING: "inProgress",
  MEETING_INVITED: "nextStep",
  FORM_TWO_OPEN: "nextStep",
  FORM_TWO_SUBMITTED: "inProgress",
  FINAL_REVIEW: "inProgress",
};

const ratingLabels: Record<ApplicantScreeningRating, string> = {
  RECOMMENDED: "Direkomendasikan",
  CONSIDER: "Layak dipertimbangkan",
  NOT_RECOMMENDED: "Belum direkomendasikan",
};

const ratingStyles: Record<ApplicantScreeningRating, string> = {
  RECOMMENDED: "recommended",
  CONSIDER: "consider",
  NOT_RECOMMENDED: "notRecommended",
};

type Application = {
  id: string;
  fullName: string;
  nim: string;
  email: string;
  studyProgram: { name: string };
  cohort: string;
  stage: ApplicantStage;
  decision: ApplicantDecision | null;
  screeningRating: ApplicantScreeningRating | null;
  createdAt: Date;
};

function getPageHref(page: number, query: string, rating: ApplicantRatingFilter) {
  const params = new URLSearchParams({ page: String(page) });
  if (query) params.set("q", query);
  if (rating !== "ALL") params.set("rating", rating);
  return `/recruitment/applicants?${params.toString()}`;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return `${words[0][0]}${words.length > 1 ? words.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}

function getStatusClassName(application: Application) {
  const statusClass = application.decision
    ? decisionStyles[application.decision]
    : stageStyles[application.stage];

  return styles[statusClass];
}

function getStatusLabel(application: Application) {
  return application.decision
    ? decisionLabels[application.decision]
    : stageLabels[application.stage];
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function isInvitable(application: Application) {
  return (
    application.decision === null &&
    (application.stage === "SUBMITTED" || application.stage === "SCREENING")
  );
}

function isResultAnnouncable(application: Application) {
  return (
    application.decision === null &&
    (application.stage === "FORM_TWO_SUBMITTED" || application.stage === "FINAL_REVIEW")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function RecruitmentApplicantsPage({
  applications,
  page,
  total,
  totalPages,
  query,
  rating,
}: {
  applications: Application[];
  page: number;
  total: number;
  totalPages: number;
  query: string;
  rating: ApplicantRatingFilter;
}) {
  const router = useRouter();
  const { confirm } = useConfirmDialog();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<"invite" | "announce" | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [announcementDecision, setAnnouncementDecision] = useState<ApplicantDecision>("ACCEPTED");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const invitableApplications = applications.filter(isInvitable);
  const announcableApplications = applications.filter(isResultAnnouncable);
  const allInvitableSelected =
    invitableApplications.length > 0 &&
    invitableApplications.every(({ id }) => selectedIds.includes(id));
  const allAnnouncableSelected =
    announcableApplications.length > 0 &&
    announcableApplications.every(({ id }) => selectedIds.includes(id));

  function toggleSelection(id: string) {
    const application = applications.find((item) => item.id === id);
    if (!application) return;
    const itemMode = isInvitable(application) ? "invite" : "announce";
    if (selectionMode && selectionMode !== itemMode) {
      setActionError("Pilih pendaftar dari satu proses saja: undangan atau pengumuman hasil.");
      return;
    }
    if (!selectedIds.includes(id) && selectedIds.length >= 100) {
      setActionError("Proses massal dibatasi maksimal 100 pendaftar sekali proses.");
      return;
    }
    const isRemoving = selectedIds.includes(id);
    setSelectedIds((current) => isRemoving
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]);
    if (!isRemoving) setSelectionMode(itemMode);
    else if (selectedIds.length === 1) setSelectionMode(null);
    setActionError("");
    setActionMessage("");
  }

  function toggleAllOnPage(mode: "invite" | "announce") {
    if (selectionMode && selectionMode !== mode && selectedIds.length > 0) {
      setActionError("Pilih pendaftar dari satu proses saja: undangan atau pengumuman hasil.");
      return;
    }
    const eligible = mode === "invite" ? invitableApplications : announcableApplications;
    const eligibleIds = eligible.map(({ id }) => id);
    const newIds = eligibleIds.filter((id) => !selectedIds.includes(id));
    const allSelected = mode === "invite" ? allInvitableSelected : allAnnouncableSelected;
    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !eligibleIds.includes(id))
        : [...current, ...newIds].slice(0, 100),
    );
    setSelectionMode(allSelected ? null : mode);
    setActionError(
      !allSelected && selectedIds.length + newIds.length > 100
        ? "Proses massal dibatasi maksimal 100 pendaftar sekali proses."
        : "",
    );
    setActionMessage("");
  }

  async function inviteSelected() {
    if (!selectedIds.length) return;
    const confirmed = await confirm({
      title: "Undang pendaftar terpilih?",
      description: `${selectedIds.length} pendaftar akan diundang ke tahap pertemuan.`,
      confirmLabel: "Kirim undangan",
    });
    if (!confirmed) return;

    setIsInviting(true);
    setActionError("");
    setActionMessage("");
    try {
      const response = await fetch("/api/recruitment-applications/bulk-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationIds: selectedIds }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Undangan massal gagal disimpan.",
        );
      }
      const invitedCount =
        isRecord(result) && typeof result.invitedCount === "number"
          ? result.invitedCount
          : selectedIds.length;
      setSelectedIds([]);
      setSelectionMode(null);
      setActionMessage(`${invitedCount} calon anggota berhasil diundang.`);
      router.refresh();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Undangan massal gagal disimpan.",
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function announceSelected() {
      if (!selectedIds.length) return;
      if (!(await confirm({
        title: "Umumkan hasil seleksi?",
        description: `Hasil akan diumumkan untuk ${selectedIds.length} pendaftar terpilih.`,
        confirmLabel: "Umumkan hasil",
      }))) return;
      setIsAnnouncing(true);
      setActionError("");
      setActionMessage("");
      try {
        const response = await fetch("/api/recruitment-applications/bulk-announce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationIds: selectedIds, decision: announcementDecision }),
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            isRecord(result) && typeof result.error === "string"
              ? result.error
              : "Pengumuman hasil gagal disimpan.",
          );
        }
        const announcedCount =
          isRecord(result) && typeof result.announcedCount === "number"
            ? result.announcedCount
            : selectedIds.length;
        setSelectedIds([]);
        setSelectionMode(null);
        setActionMessage(`Hasil ${announcedCount} calon anggota sudah diumumkan.`);
        router.refresh();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Pengumuman hasil gagal disimpan.");
      } finally {
        setIsAnnouncing(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>PENGELOLAAN REKRUTMEN</span>
          <h1>Data pendaftar</h1>
          <p>Periksa data awal calon anggota yang sudah mengirim formulir.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.settingsLink} href="/recruitment/meetings">
            Jadwal pertemuan
          </Link>
          <Link className={styles.settingsLink} href="/recruitment">
            Pengaturan pendaftaran
          </Link>
        </div>
      </header>

      <section className={styles.card} aria-labelledby="applicants-title">
        <div className={styles.toolbar}>
          <div className={styles.resultCount}>
            <UsersRound size={18} aria-hidden="true" />
            <h2 id="applicants-title">{total} pendaftar</h2>
          </div>
          <div className={styles.headerTools}>
          <form className={styles.search} action="/recruitment/applicants">
            <input type="hidden" name="page" value="1" />
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Cari nama, NIM, atau email"
              aria-label="Cari nama, NIM, atau email"
            />
            <select
              className={styles.ratingFilter}
              name="rating"
              defaultValue={rating}
              aria-label="Filter penilaian screening"
            >
              <option value="ALL">Semua penilaian</option>
              <option value="UNRATED">Belum dinilai</option>
              <option value="RECOMMENDED">Direkomendasikan</option>
              <option value="CONSIDER">Layak dipertimbangkan</option>
              <option value="NOT_RECOMMENDED">Belum direkomendasikan</option>
            </select>
            <button type="submit">Terapkan</button>
          </form>
          <div className={styles.bulkShortcuts}>
            <button type="button" onClick={() => toggleAllOnPage("invite")} disabled={!invitableApplications.length || isInviting || isAnnouncing}>
              Pilih calon undangan ({invitableApplications.length})
            </button>
            <button type="button" onClick={() => toggleAllOnPage("announce")} disabled={!announcableApplications.length || isInviting || isAnnouncing}>
              Pilih calon untuk diumumkan ({announcableApplications.length})
            </button>
          </div>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className={styles.bulkBar}>
            <span>{selectedIds.length} pendaftar dipilih</span>
            {selectionMode === "invite" && <button
              type="button"
              className={styles.inviteButton}
              onClick={() => void inviteSelected()}
              disabled={isInviting}
            >
              <Send size={15} aria-hidden="true" />
              {isInviting ? "Mengundang..." : "Undang ke pertemuan"}
            </button>}
            {selectionMode === "announce" && (
              <>
                <select
                  value={announcementDecision}
                  onChange={(event) => setAnnouncementDecision(event.target.value as ApplicantDecision)}
                  disabled={isAnnouncing}
                  aria-label="Hasil seleksi yang diumumkan"
                >
                  <option value="ACCEPTED">Diterima</option>
                  <option value="WAITLISTED">Daftar tunggu</option>
                  <option value="REJECTED">Tidak diterima</option>
                </select>
                <button
                  type="button"
                  className={styles.inviteButton}
                  onClick={() => void announceSelected()}
                  disabled={isAnnouncing}
                >
                  <Megaphone size={15} aria-hidden="true" />
                  {isAnnouncing ? "Mengumumkan..." : "Umumkan hasil"}
                </button>
              </>
            )}
            <button
              type="button"
              className={styles.clearSelection}
              onClick={() => {
                setSelectedIds([]);
                setSelectionMode(null);
              }}
              disabled={isInviting || isAnnouncing}
            >
              Batal pilih
            </button>
          </div>
        )}
        {(actionError || actionMessage) && (
          <p
            className={actionError ? styles.actionError : styles.actionSuccess}
            role={actionError ? "alert" : "status"}
          >
            {actionError || actionMessage}
          </p>
        )}

        {applications.length > 0 ? (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th scope="col">
                    <input
                      type="checkbox"
                      checked={selectionMode === "announce" ? allAnnouncableSelected : allInvitableSelected}
                      disabled={
                        (!invitableApplications.length && !announcableApplications.length) ||
                        isInviting ||
                        isAnnouncing
                      }
                      onChange={() => toggleAllOnPage(selectionMode ?? "invite")}
                      aria-label="Pilih semua pendaftar pada halaman ini"
                      title="Pilih semua pendaftar"
                    />
                  </th>
                  <th scope="col">Pendaftar</th>
                  <th scope="col">NIM</th>
                  <th scope="col">Program studi</th>
                  <th scope="col">Angkatan</th>
                  <th scope="col">Penilaian</th>
                  <th scope="col">Tahap</th>
                  <th scope="col">Terdaftar</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(application.id)}
                        disabled={
                            (!isInvitable(application) && !isResultAnnouncable(application)) ||
                            isInviting || isAnnouncing ||
                            (selectionMode === "invite" && !isInvitable(application)) ||
                            (selectionMode === "announce" && !isResultAnnouncable(application)) ||
                          (!selectedIds.includes(application.id) && selectedIds.length >= 100)
                        }
                        onChange={() => toggleSelection(application.id)}
                        aria-label={`Pilih ${application.fullName}`}
                      />
                    </td>
                    <td>
                      <Link
                        className={styles.applicantNameLink}
                        href={`/recruitment/applicants/${application.id}`}
                      >
                        {application.fullName}
                      </Link>
                      <span className={styles.applicantEmail}>{application.email}</span>
                    </td>
                    <td>{application.nim}</td>
                    <td>{application.studyProgram.name}</td>
                    <td>{application.cohort}</td>
                    <td>
                      {application.screeningRating ? (
                        <span
                          className={`${styles.stage} ${
                            styles[ratingStyles[application.screeningRating]]
                          }`}
                        >
                          {ratingLabels[application.screeningRating]}
                        </span>
                      ) : (
                        <span className={styles.unrated}>Belum dinilai</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.stage} ${getStatusClassName(application)}`}>
                        {getStatusLabel(application)}
                      </span>
                    </td>
                    <td>{formatDate(application.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {applications.length > 0 ? (
          <div className={styles.mobileList}>
            <button
              type="button"
              className={styles.mobileSelectAll}
              disabled={!invitableApplications.length || isInviting}
              onClick={() => toggleAllOnPage(selectionMode ?? "invite")}
            >
              {selectionMode === "announce" && allAnnouncableSelected
                ? "Batalkan pilihan calon pengumuman"
                : selectionMode !== "announce" && allInvitableSelected
                ? "Batalkan pilihan halaman ini"
                : `Pilih semua calon yang tersedia`}
            </button>
            {applications.map((application) => (
              <article className={styles.applicantCard} key={application.id}>
                <label className={styles.mobileSelection}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(application.id)}
                    disabled={
                      (!isInvitable(application) && !isResultAnnouncable(application)) ||
                      isInviting || isAnnouncing ||
                      (selectionMode === "invite" && !isInvitable(application)) ||
                      (selectionMode === "announce" && !isResultAnnouncable(application)) ||
                      (!selectedIds.includes(application.id) && selectedIds.length >= 100)
                    }
                    onChange={() => toggleSelection(application.id)}
                  />
                  {isResultAnnouncable(application) ? "Pilih untuk pengumuman hasil" : "Pilih untuk undangan"}
                </label>
                <div className={styles.applicantCardHeader}>
                  <span className={styles.avatar} aria-hidden="true">
                    {getInitials(application.fullName)}
                  </span>
                  <div className={styles.applicantIdentity}>
                    <Link
                      className={styles.applicantNameLink}
                      href={`/recruitment/applicants/${application.id}`}
                    >
                      {application.fullName}
                    </Link>
                    <span className={styles.applicantEmail}>{application.email}</span>
                  </div>
                  <span className={`${styles.stage} ${getStatusClassName(application)}`}>
                    {getStatusLabel(application)}
                  </span>
                </div>
                <dl className={styles.applicantFacts}>
                  <div>
                    <dt>NIM</dt>
                    <dd>{application.nim}</dd>
                  </div>
                  <div>
                    <dt>Angkatan</dt>
                    <dd>{application.cohort}</dd>
                  </div>
                  <div>
                    <dt>Penilaian</dt>
                    <dd>
                      {application.screeningRating
                        ? ratingLabels[application.screeningRating]
                        : "Belum dinilai"}
                    </dd>
                  </div>
                  <div>
                    <dt>Program studi</dt>
                    <dd>{application.studyProgram.name}</dd>
                  </div>
                  <div>
                    <dt>Terdaftar</dt>
                    <dd>{formatDate(application.createdAt)}</dd>
                  </div>
                </dl>
                <Link
                  className={styles.detailLink}
                  href={`/recruitment/applicants/${application.id}`}
                >
                  Lihat detail <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <UsersRound size={25} aria-hidden="true" />
            <h3>{query ? "Pendaftar tidak ditemukan" : "Belum ada pendaftar"}</h3>
            <p>
              {query
                ? "Coba kata kunci lain, seperti nama, NIM, atau alamat email."
                : "Pendaftar akan muncul di sini setelah mengirim formulir."}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label="Halaman daftar pendaftar">
            <span>
              Halaman {page} dari {totalPages}
            </span>
            <div>
              {page > 1 && (
                <Link href={getPageHref(page - 1, query, rating)}>Sebelumnya</Link>
              )}
              {page < totalPages && (
                <Link href={getPageHref(page + 1, query, rating)}>Berikutnya</Link>
              )}
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}
