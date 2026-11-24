"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Plus,
  Save,
  Trash2,
  UsersRound,
  Video,
  XCircle,
} from "lucide-react";
import type {
  ApplicantDecision,
  ApplicantMeetingAttendance,
  ApplicantStage,
} from "@/generated/prisma/client";
import { useConfirmDialog } from "@/components/ui/use-confirm-dialog";
import styles from "./recruitment-meetings-page.module.css";

type MeetingApplicant = {
  id: string;
  fullName: string;
  email: string;
  meetingAttendance: ApplicantMeetingAttendance | null;
  stage: ApplicantStage;
  decision: ApplicantDecision | null;
};

type MeetingSession = {
  id: string;
  title: string;
  startsAt: string | Date;
  endsAt: string | Date;
  location: string;
  capacity: number;
  isActive: boolean;
  bookedCount: number;
  applications: MeetingApplicant[];
};

type MeetingOverview = {
  sessions: MeetingSession[];
  onlineApplications: MeetingApplicant[];
  zoomEnabled: boolean;
  zoomUrl: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatSessionDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function formatSessionTime(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function getErrorMessage(result: unknown, fallback: string) {
  return isRecord(result) && typeof result.error === "string"
    ? result.error
    : fallback;
}

type AttendanceFilter = "ALL" | "UNRECORDED" | ApplicantMeetingAttendance;

function isEligibleForForm(
  participant: MeetingApplicant,
  attendance: ApplicantMeetingAttendance | null,
) {
  return (
    participant.stage === "MEETING_INVITED" &&
    participant.decision === null &&
    attendance === "PRESENT"
  );
}

function ParticipantList({
  participants,
  label,
  filter,
  attendanceById,
  selectedIds,
  isAdvancing,
  onAttendanceSaved,
  onToggleSelection,
}: {
  participants: MeetingApplicant[];
  label: string;
  filter: AttendanceFilter;
  attendanceById: Record<string, ApplicantMeetingAttendance | null>;
  selectedIds: string[];
  isAdvancing: boolean;
  onAttendanceSaved: (participantId: string, value: ApplicantMeetingAttendance | null) => void;
  onToggleSelection: (participant: MeetingApplicant) => void;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const visibleParticipants = participants.filter((participant) => {
    const value = attendanceById[participant.id] ?? null;
    return (
      filter === "ALL" ||
      (filter === "UNRECORDED" && value === null) ||
      value === filter
    );
  });

  async function updateAttendance(
    participantId: string,
    nextAttendance: ApplicantMeetingAttendance,
  ) {
    const newAttendance =
      attendanceById[participantId] === nextAttendance ? null : nextAttendance;
    setError("");
    setSavingId(participantId);
    try {
      const response = await fetch(`/api/recruitment-applications/${participantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingAttendance: newAttendance }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(result, "Kehadiran gagal disimpan."));
      }
      onAttendanceSaved(participantId, newAttendance);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Kehadiran gagal disimpan.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <details className={styles.participantDetails} open>
      <summary>
        <UsersRound size={15} aria-hidden="true" />
        {label} ({visibleParticipants.length})
      </summary>
      {error && (
        <p className={styles.attendanceError} role="alert">
          {error}
        </p>
      )}
      {visibleParticipants.length ? (
        <ul className={styles.participantList}>
          {visibleParticipants.map((participant) => {
            const participantAttendance = attendanceById[participant.id] ?? null;
            const canAdvance = isEligibleForForm(participant, participantAttendance);
            return (
              <li key={participant.id}>
                <div className={styles.participantIdentity}>
                  <span className={styles.participantName}>{participant.fullName}</span>
                  <span>{participant.email}</span>
                </div>
                <div className={styles.participantActions}>
                  <span className={styles.attendanceStatus}>
                    {participantAttendance === "PRESENT"
                      ? "Hadir"
                      : participantAttendance === "ABSENT"
                        ? "Tidak hadir"
                        : "Belum dicatat"}
                  </span>
                  <button
                    type="button"
                    className={`${styles.attendanceButton} ${
                      participantAttendance === "PRESENT" ? styles.selectedPresent : ""
                    }`}
                    aria-pressed={participantAttendance === "PRESENT"}
                    disabled={
                      savingId !== null ||
                      isAdvancing ||
                      participant.stage !== "MEETING_INVITED" ||
                      participant.decision !== null
                    }
                    onClick={() => void updateAttendance(participant.id, "PRESENT")}
                  >
                    <CheckCircle2 size={14} aria-hidden="true" />
                    Hadir
                  </button>
                  <button
                    type="button"
                    className={`${styles.attendanceButton} ${
                      participantAttendance === "ABSENT" ? styles.selectedAbsent : ""
                    }`}
                    aria-pressed={participantAttendance === "ABSENT"}
                    disabled={
                      savingId !== null ||
                      isAdvancing ||
                      participant.stage !== "MEETING_INVITED" ||
                      participant.decision !== null
                    }
                    onClick={() => void updateAttendance(participant.id, "ABSENT")}
                  >
                    <XCircle size={14} aria-hidden="true" />
                    Tidak hadir
                  </button>
                  {canAdvance && (
                    <label className={styles.advancementCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(participant.id)}
                        disabled={
                          isAdvancing ||
                          (!selectedIds.includes(participant.id) &&
                            selectedIds.length >= 100)
                        }
                        onChange={() => onToggleSelection(participant)}
                        aria-label={`Pilih ${participant.fullName} untuk formulir lanjutan`}
                      />
                      Lanjut
                    </label>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.noParticipants}>
          {participants.length
            ? "Tidak ada peserta pada filter ini."
            : "Belum ada calon yang memilih metode ini."}
        </p>
      )}
    </details>
  );
}

export function RecruitmentMeetingsPage({
  initialOverview,
}: {
  initialOverview: MeetingOverview;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const allParticipants = [
    ...initialOverview.sessions.flatMap(({ applications }) => applications),
    ...initialOverview.onlineApplications,
  ];
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>("ALL");
  const [attendanceById, setAttendanceById] = useState<
    Record<string, ApplicantMeetingAttendance | null>
  >(() =>
    Object.fromEntries(
      allParticipants.map(({ id, meetingAttendance }) => [id, meetingAttendance]),
    ),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [zoomEnabled, setZoomEnabled] = useState(initialOverview.zoomEnabled);
  const [zoomUrl, setZoomUrl] = useState(initialOverview.zoomUrl);
  const [capacities, setCapacities] = useState(
    Object.fromEntries(
      initialOverview.sessions.map((session) => [session.id, session.capacity]),
    ),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const eligibleParticipants = allParticipants.filter((participant) =>
    isEligibleForForm(
      participant,
      attendanceById[participant.id] ?? null,
    ),
  );

  function handleAttendanceSaved(
    participantId: string,
    value: ApplicantMeetingAttendance | null,
  ) {
    setAttendanceById((current) => ({ ...current, [participantId]: value }));
    if (value !== "PRESENT") {
      setSelectedIds((current) => current.filter((id) => id !== participantId));
    }
  }

  function toggleParticipant(participant: MeetingApplicant) {
    if (selectedIds.includes(participant.id)) {
      setSelectedIds((current) => current.filter((id) => id !== participant.id));
    } else if (selectedIds.length >= 100) {
      setBulkError("Maksimal 100 peserta dapat dipilih untuk satu proses.");
      return;
    } else {
      setSelectedIds((current) => [...current, participant.id]);
    }
    setBulkError("");
    setBulkSuccess("");
  }

  function toggleAllPresent() {
    const allSelected =
      eligibleParticipants.length > 0 &&
      eligibleParticipants.every(({ id }) => selectedIds.includes(id));
    if (allSelected) {
      const eligibleIds = new Set(eligibleParticipants.map(({ id }) => id));
      setSelectedIds((current) => current.filter((id) => !eligibleIds.has(id)));
      return;
    }
    const additions = eligibleParticipants
      .map(({ id }) => id)
      .filter((id) => !selectedIds.includes(id));
    setSelectedIds((current) => [...current, ...additions].slice(0, 100));
    setBulkError(
      selectedIds.length + additions.length > 100
        ? "Pilihan dibatasi maksimal 100 peserta. Sebagian peserta belum dipilih."
        : "",
    );
    setBulkSuccess("");
  }

  async function openFormForSelected() {
    if (!selectedIds.length) return;
    if (!(await confirm({
      title: "Buka formulir tahap lanjutan?",
      description: `Formulir akan dibuka untuk ${selectedIds.length} peserta yang hadir.`,
      confirmLabel: "Buka formulir",
    }))) {
      return;
    }
    setIsAdvancing(true);
    setBulkError("");
    setBulkSuccess("");
    try {
      const response = await fetch(
        "/api/recruitment-applications/bulk-open-form-two",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationIds: selectedIds }),
        },
      );
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, "Formulir lanjutan gagal dibuka."),
        );
      }
      const count =
        isRecord(result) && typeof result.updatedCount === "number"
          ? result.updatedCount
          : selectedIds.length;
      setSelectedIds([]);
      setBulkSuccess(`Formulir tahap lanjutan dibuka untuk ${count} peserta.`);
      router.refresh();
    } catch (requestError) {
      setBulkError(
        requestError instanceof Error
          ? requestError.message
          : "Formulir lanjutan gagal dibuka.",
      );
    } finally {
      setIsAdvancing(false);
    }
  }

  async function submitJson(
    url: string,
    method: "POST" | "PATCH" | "DELETE",
    body?: Record<string, unknown>,
  ) {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const result: unknown = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(result, "Perubahan gagal disimpan."));
    return result;
  }

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);
    const form = event.currentTarget;
    const values = new FormData(form);

    try {
      await submitJson("/api/recruitment-meetings", "POST", {
        title: values.get("title"),
        startsAt: values.get("startsAt"),
        endsAt: values.get("endsAt"),
        location: values.get("location"),
        capacity: Number(values.get("capacity")),
      });
      form.reset();
      setSuccess("Sesi pertemuan berhasil ditambahkan.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sesi pertemuan gagal ditambahkan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateSession(session: MeetingSession, form: HTMLFormElement) {
    setError("");
    setSuccess("");
    setIsSaving(true);
    const values = new FormData(form);
    try {
      await submitJson(`/api/recruitment-meetings/${session.id}`, "PATCH", {
        capacity: Number(values.get("capacity")),
        isActive: values.get("isActive") === "on",
      });
      setSuccess(`Pengaturan sesi "${session.title}" berhasil diperbarui.`);
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Pengaturan sesi gagal diperbarui.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSession(session: MeetingSession) {
    if (!(await confirm({
      title: "Hapus sesi pertemuan?",
      description: `Sesi "${session.title}" akan dihapus dan tidak dapat dipulihkan.`,
      confirmLabel: "Hapus sesi",
      destructive: true,
    }))) return;
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      await submitJson(`/api/recruitment-meetings/${session.id}`, "DELETE");
      setSuccess("Sesi pertemuan berhasil dihapus.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sesi pertemuan gagal dihapus.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleZoomSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);
    try {
      await submitJson("/api/recruitment-meetings", "POST", {
        kind: "settings",
        zoomEnabled,
        zoomUrl,
      });
      setSuccess("Pengaturan pilihan Zoom berhasil disimpan.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Pengaturan Zoom gagal disimpan.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      {dialog}
      <Link className={styles.backLink} href="/recruitment/applicants">
        <ArrowLeft size={17} aria-hidden="true" />
        Kembali ke data pendaftar
      </Link>

      <header className={styles.heading}>
        <span className={styles.eyebrow}>PENGELOLAAN REKRUTMEN</span>
        <h1>Jadwal pertemuan</h1>
        <p>
          Buat beberapa sesi tatap muka dan atur kapasitasnya. Calon anggota
          memilih sendiri sesi yang masih tersedia.
        </p>
      </header>

      {(error || success) && (
        <p className={error ? styles.error : styles.success} role={error ? "alert" : "status"}>
          {error || success}
        </p>
      )}

      <section className={styles.section} aria-labelledby="create-session-title">
        <div className={styles.sectionHeading}>
          <span className={styles.icon} aria-hidden="true">
            <Plus size={19} />
          </span>
          <div>
            <h2 id="create-session-title">Tambah sesi tatap muka</h2>
            <p>Waktu yang dimasukkan menggunakan zona waktu WIB.</p>
          </div>
        </div>
        <form className={styles.createForm} onSubmit={handleCreateSession}>
          <label>
            Nama sesi
            <input name="title" required maxLength={120} placeholder="Sesi pagi" />
          </label>
          <label>
            Waktu mulai
            <input name="startsAt" type="datetime-local" required />
          </label>
          <label>
            Waktu selesai
            <input name="endsAt" type="datetime-local" required />
          </label>
          <label>
            Lokasi
            <input name="location" required maxLength={240} placeholder="Ruang atau gedung" />
          </label>
          <label>
            Kapasitas
            <input name="capacity" type="number" min={1} max={500} defaultValue={20} required />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>
            <Plus size={16} aria-hidden="true" />
            {isSaving ? "Menyimpan..." : "Tambah sesi"}
          </button>
        </form>
      </section>

      <section className={styles.section} aria-labelledby="sessions-title">
        <div className={styles.sectionHeading}>
          <span className={styles.icon} aria-hidden="true">
            <CalendarDays size={19} />
          </span>
          <div>
            <h2 id="sessions-title">Sesi yang tersedia</h2>
            <p>Nonaktifkan sesi untuk menghentikan pilihan baru tanpa menghapus pilihan yang sudah dibuat.</p>
          </div>
        </div>
        <div className={styles.attendanceToolbar}>
          <label>
            Filter kehadiran
            <select
              value={attendanceFilter}
              onChange={(event) =>
                setAttendanceFilter(event.target.value as AttendanceFilter)
              }
            >
              <option value="ALL">Semua peserta</option>
              <option value="PRESENT">Hadir</option>
              <option value="ABSENT">Tidak hadir</option>
              <option value="UNRECORDED">Belum dicatat</option>
            </select>
          </label>
          <span className={styles.eligibleCount}>
            {eligibleParticipants.length} peserta hadir siap lanjut
          </span>
          <button
            type="button"
            className={styles.selectAllButton}
            onClick={toggleAllPresent}
            disabled={!eligibleParticipants.length || isAdvancing}
          >
            {eligibleParticipants.length > 0 &&
            eligibleParticipants.every(({ id }) => selectedIds.includes(id))
              ? "Batalkan pilih peserta hadir"
              : "Pilih semua peserta hadir"}
          </button>
          {selectedIds.length > 0 && (
            <div className={styles.bulkAdvanceBar}>
              <span>{selectedIds.length} peserta dipilih</span>
              <button
                type="button"
                className={styles.advanceButton}
                onClick={() => void openFormForSelected()}
                disabled={isAdvancing}
              >
                {isAdvancing ? "Membuka formulir..." : "Buka formulir lanjutan"}
              </button>
              <button
                type="button"
                className={styles.cancelSelectionButton}
                onClick={() => setSelectedIds([])}
                disabled={isAdvancing}
              >
                Batal pilih
              </button>
            </div>
          )}
          {(bulkError || bulkSuccess) && (
            <p
              className={bulkError ? styles.error : styles.success}
              role={bulkError ? "alert" : "status"}
            >
              {bulkError || bulkSuccess}
            </p>
          )}
        </div>
        {initialOverview.sessions.length ? (
          <div className={styles.sessionList}>
            {initialOverview.sessions.map((session) => (
              <article className={styles.sessionCard} key={session.id}>
                <div className={styles.sessionHeader}>
                  <div>
                    <h3>{session.title}</h3>
                    <p className={styles.sessionDate}>{formatSessionDate(session.startsAt)}</p>
                  </div>
                  <span className={session.isActive ? styles.activeBadge : styles.inactiveBadge}>
                    {session.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div className={styles.sessionMeta}>
                  <span>
                    <CalendarDays size={15} aria-hidden="true" />
                    {formatSessionTime(session.startsAt)}–{formatSessionTime(session.endsAt)} WIB
                  </span>
                  <span>
                    <MapPin size={15} aria-hidden="true" />
                    {session.location}
                  </span>
                  <span>
                    <UsersRound size={15} aria-hidden="true" />
                    {session.bookedCount} dari {session.capacity} orang
                  </span>
                </div>
                <ParticipantList
                  participants={session.applications}
                  label="Daftar peserta"
                  filter={attendanceFilter}
                  attendanceById={attendanceById}
                  selectedIds={selectedIds}
                  isAdvancing={isAdvancing}
                  onAttendanceSaved={handleAttendanceSaved}
                  onToggleSelection={toggleParticipant}
                />
                <form
                  className={styles.sessionActions}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleUpdateSession(session, event.currentTarget);
                  }}
                >
                  <label>
                    Kapasitas
                    <input
                      name="capacity"
                      type="number"
                      min={Math.max(1, session.bookedCount)}
                      max={500}
                      required
                      value={capacities[session.id] ?? session.capacity}
                      onChange={(event) =>
                        setCapacities((current) => ({
                          ...current,
                          [session.id]: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className={styles.activeToggle}>
                    <input name="isActive" type="checkbox" defaultChecked={session.isActive} />
                    Terima pilihan baru
                  </label>
                  <button type="submit" className={styles.secondaryButton} disabled={isSaving}>
                    <Save size={15} aria-hidden="true" /> Simpan
                  </button>
                  <button
                    type="button"
                    className={styles.deleteButton}
                    disabled={isSaving || session.bookedCount > 0}
                    onClick={() => void handleDeleteSession(session)}
                    aria-label={`Hapus ${session.title}`}
                    title={
                      session.bookedCount > 0
                        ? "Tidak dapat menghapus sesi yang sudah dipilih"
                        : "Hapus sesi"
                    }
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>Belum ada sesi. Tambahkan sesi pertama di atas.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="online-participants-title">
        <div className={styles.sectionHeading}>
          <span className={styles.icon} aria-hidden="true">
            <Video size={19} />
          </span>
          <div>
            <h2 id="online-participants-title">Peserta pertemuan online</h2>
            <p>Calon yang memilih pertemuan melalui Zoom.</p>
          </div>
        </div>
        <ParticipantList
          participants={initialOverview.onlineApplications}
          label="Daftar peserta Zoom"
          filter={attendanceFilter}
          attendanceById={attendanceById}
          selectedIds={selectedIds}
          isAdvancing={isAdvancing}
          onAttendanceSaved={handleAttendanceSaved}
          onToggleSelection={toggleParticipant}
        />
      </section>

      <section className={styles.section} aria-labelledby="zoom-title">
        <div className={styles.sectionHeading}>
          <span className={styles.icon} aria-hidden="true">
            <Video size={19} />
          </span>
          <div>
            <h2 id="zoom-title">Pilihan Zoom</h2>
            <p>
              Pilihan ini tersembunyi dari calon anggota sampai admin mengaktifkannya.
              Calon yang sudah memilih Zoom tetap dapat melihat tautannya.
            </p>
          </div>
        </div>
        <form className={styles.zoomForm} onSubmit={handleZoomSave}>
          <label className={styles.zoomToggle}>
            <span>
              <strong>Tampilkan pilihan Zoom</strong>
              <small>Aktifkan jika ada calon yang tidak bisa menghadiri sesi tatap muka.</small>
            </span>
            <input
              type="checkbox"
              checked={zoomEnabled}
              onChange={(event) => setZoomEnabled(event.target.checked)}
            />
          </label>
          <label className={styles.zoomUrl}>
            Tautan Zoom
            <input
              type="url"
              value={zoomUrl}
              onChange={(event) => setZoomUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>
            <Save size={16} aria-hidden="true" />
            {isSaving ? "Menyimpan..." : "Simpan pilihan Zoom"}
          </button>
        </form>
      </section>
    </main>
  );
}
