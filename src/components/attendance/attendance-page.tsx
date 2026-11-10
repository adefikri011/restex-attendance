"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  FileText,
  MapPin,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import type { AppRoleId } from "@/components/auth/role-config";
import styles from "./attendance.module.css";
import { AttendanceSessionForm } from "./attendance-session-form";
import {
  formatSessionDate,
  getActiveMembers,
  getSessionCounts,
  type AttendanceMember,
  type AttendanceSession,
  type SessionStatus,
} from "./attendance-data";

const filters: Array<{ label: string; value: SessionStatus | "Semua" }> = [
  { label: "Semua sesi", value: "Semua" },
  { label: "Aktif", value: "Aktif" },
  { label: "Draft", value: "Draft" },
  { label: "Ditutup", value: "Ditutup" },
];

type AttendancePageProps = {
  sessions: AttendanceSession[];
  members: AttendanceMember[];
  periodName: string | null;
  role: AppRoleId;
  division: string | undefined;
};

export function AttendancePage({
  sessions: initialSessions,
  members,
  periodName,
  role,
  division,
}: AttendancePageProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] =
    useState<SessionStatus | "Semua">("Semua");
  const [search, setSearch] = useState("");
  const activeMembers = getActiveMembers(members);
  const canManage = role === "ketua-divisi" || role === "pj-divisi";

  function getCounts(session: AttendanceSession) {
    const sessionMembers = session.division
      ? activeMembers.filter((member) => member.division === session.division)
      : activeMembers;
    return getSessionCounts(session, sessionMembers.length);
  }

  function handleCreated(session: AttendanceSession) {
    setSessions((current) => [session, ...current]);
    setIsCreateOpen(false);
    router.push(`/attendance/${session.id}`);
  }

  const activeSession = sessions.find((session) => session.status === "Aktif");
  const canCreateSession =
    Boolean(periodName) && !activeSession && activeMembers.length > 0;
  const createSessionDisabledReason = !periodName
    ? "Belum ada periode aktif. Minta Admin mengaktifkan periode sebelum membuka sesi."
    : activeMembers.length === 0
      ? `Belum ada anggota aktif di divisi ${division ?? "ini"}. Minta Admin menambahkan anggota atau mengubah status anggota menjadi Aktif sebelum membuka sesi.`
      : null;
  const normalizedSearch = search.trim().toLocaleLowerCase("id");
  const filteredSessions = useMemo(
    () =>
      sessions.filter((session) => {
        const matchesStatus =
          selectedFilter === "Semua" || session.status === selectedFilter;
        const matchesSearch =
          normalizedSearch.length === 0 ||
          [session.title, session.type, session.location, session.id]
            .join(" ")
            .toLocaleLowerCase("id")
            .includes(normalizedSearch);
        return matchesStatus && matchesSearch;
      }),
    [normalizedSearch, selectedFilter, sessions],
  );

  const activeCount = sessions.filter(
    (session) => session.status === "Aktif",
  ).length;
  const draftCount = sessions.filter(
    (session) => session.status === "Draft",
  ).length;
  const closedSessions = sessions.filter(
    (session) => session.status === "Ditutup",
  );
  const averageAttendance = closedSessions.length
    ? Math.round(
        closedSessions.reduce((total, session) => {
          const counts = getCounts(session);
          return total + (counts.totalActive ? (counts.hadir / counts.totalActive) * 100 : 0);
        }, 0) / closedSessions.length,
      )
      : 0;

  return (
      <div className={styles.attendancePage}>
        <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>
            {canManage ? "ABSENSI DIVISI" : "MONITORING ABSENSI"} · {periodName ?? "TANPA PERIODE AKTIF"}
          </span>
          <h1>{canManage ? "Absensi Divisi" : "Monitoring Absensi"}</h1>
          <p>
            {canManage
              ? `Kelola sesi dan catat kehadiran anggota${division ? ` ${division}` : ""}.`
              : "Pantau sesi yang berlangsung dan tinjau rekap kehadiran anggota."}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            className={styles.createButton}
            onClick={() => setIsCreateOpen((open) => !open)}
            disabled={!canCreateSession}
            aria-describedby={
              !activeSession && createSessionDisabledReason
                ? "create-session-disabled-reason"
                : undefined
            }
          >
            <Plus size={15} aria-hidden="true" />
            Buka sesi
          </button>
        )}
      </header>

      {canManage && !activeSession && createSessionDisabledReason && (
      <p
        id="create-session-disabled-reason"
        className={styles.createDisabledNotice}
        role="status"
      >
        {createSessionDisabledReason}
      </p>
      )}

      {canManage && isCreateOpen && (
        <AttendanceSessionForm onCancel={() => setIsCreateOpen(false)} onCreated={handleCreated} />
      )}

      {activeSession ? (
        <section className={styles.activeBanner} aria-label="Sesi sedang berjalan">
          <div className={styles.activeBannerCopy}>
            <span className={styles.activeEyebrow}>
              <span aria-hidden="true" />
              SESI SEDANG BERJALAN
            </span>
            <h2>{activeSession.title}</h2>
            <div className={styles.activeMeta}>
              <span><CalendarDays size={14} aria-hidden="true" />{formatSessionDate(activeSession.date)}</span>
              <span><Clock3 size={14} aria-hidden="true" />Mulai {activeSession.time}</span>
              <span><MapPin size={14} aria-hidden="true" />{activeSession.location}</span>
            </div>
          </div>
          <div className={styles.activeProgress}>
            <span>KEHADIRAN TERCATAT</span>
            <strong>
              {activeSession.attendance.filter((entry) => entry.status === "Hadir").length}
              <small> / {getCounts(activeSession).totalActive}</small>
            </strong>
            <div className={styles.progressTrack}>
              <span
                style={{
                  width: `${getCounts(activeSession).totalActive
                    ? (getCounts(activeSession).hadir /
                        getCounts(activeSession).totalActive) *
                      100
                    : 0}%`,
                }}
              />
            </div>
          </div>
          <Link
            href={`/attendance/${activeSession.id}`}
            className={styles.bannerAction}
          >
            {canManage ? "Scan & rekap" : "Pantau detail"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      ) : (
        <section className={styles.emptyBanner} aria-label="Tidak ada sesi aktif">
          <span className={styles.emptyIcon}>
            <CalendarDays size={21} aria-hidden="true" />
          </span>
          <div>
            <h2>Belum ada sesi yang berjalan</h2>
            <p>
              {canManage
                ? "Buka sesi kegiatan untuk mulai mencatat kehadiran anggota."
                : "Sesi aktif akan muncul di sini setelah dibuka oleh pengurus divisi."}
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              className={styles.emptyAction}
              onClick={() => setIsCreateOpen(true)}
              disabled={!canCreateSession}
              aria-describedby={
                createSessionDisabledReason
                  ? "create-session-disabled-reason"
                  : undefined
              }
            >
              <Plus size={14} aria-hidden="true" />
              Buka sesi
            </button>
          )}
        </section>
      )}

      <section className={styles.metricsGrid} aria-label="Ringkasan sesi">
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconNavy}`}>
            <FileText size={17} aria-hidden="true" />
          </span>
          <span className={styles.metricLabel}>Total sesi</span>
          <strong>{sessions.length}</strong>
          <small>{periodName ?? "Periode belum aktif"}</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconGreen}`}>
            <span aria-hidden="true" />
          </span>
          <span className={styles.metricLabel}>Sedang dipantau</span>
          <strong>{activeCount}</strong>
          <small>{activeCount ? "Sesi berlangsung" : "Tidak ada sesi aktif"}</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconAmber}`}>
            <Clock3 size={17} aria-hidden="true" />
          </span>
          <span className={styles.metricLabel}>Draft</span>
          <strong>{draftCount}</strong>
          <small>{canManage ? "Siap dibuka oleh pengurus" : "Menunggu pengurus divisi"}</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconRose}`}>
            <UsersRound size={17} aria-hidden="true" />
          </span>
          <span className={styles.metricLabel}>Rata-rata hadir</span>
          <strong>{averageAttendance}%</strong>
          <small>{closedSessions.length ? "Dari sesi yang ditutup" : "Belum ada sesi ditutup"}</small>
        </article>
      </section>

      <section className={styles.sessionsPanel} aria-labelledby="sessions-title">
        <div className={styles.panelHeading}>
          <div>
            <span className={styles.panelEyebrow}>RIWAYAT KEGIATAN</span>
            <h2 id="sessions-title">Semua sesi</h2>
            <p>
              {canManage
                ? "Riwayat sesi dan kehadiran divisi yang menjadi tanggung jawabmu."
                : "Admin memiliki akses baca untuk seluruh sesi pada periode aktif."}
            </p>
          </div>
          <label className={styles.searchBox}>
            <Search size={16} aria-hidden="true" />
            <span className={styles.visuallyHidden}>Cari sesi</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau lokasi..."
            />
          </label>
        </div>

        <div className={styles.filterTabs} role="group" aria-label="Filter status sesi">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter.value}
              className={
                selectedFilter === filter.value ? styles.selectedFilter : ""
              }
              aria-pressed={selectedFilter === filter.value}
              onClick={() => setSelectedFilter(filter.value)}
            >
              {filter.label}
              <span>
                {filter.value === "Semua"
                  ? sessions.length
                  : sessions.filter((session) => session.status === filter.value)
                      .length}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.tableScroller}>
          <table className={styles.sessionsTable}>
            <thead>
              <tr>
                <th scope="col">Nama sesi</th>
                <th scope="col">Jadwal</th>
                <th scope="col">Kehadiran</th>
                <th scope="col">Status</th>
                <th scope="col" aria-label="Detail" />
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => {
                const counts = getCounts(session);
                const statusClass =
                  session.status === "Aktif"
                    ? styles.statusActive
                    : session.status === "Draft"
                      ? styles.statusDraft
                      : styles.statusClosed;

                return (
                  <tr key={session.id}>
                    <td data-label="Sesi">
                      <span className={styles.sessionName}>
                        <span className={styles.sessionIcon}>
                          <FileText size={16} aria-hidden="true" />
                        </span>
                        <span>
                          <strong>{session.title}</strong>
                          <small>
                            {session.type}{session.division ? ` · ${session.division}` : ""} · {session.id.slice(0, 8)}
                          </small>
                        </span>
                      </span>
                    </td>
                    <td data-label="Jadwal">
                      <span className={styles.scheduleCell}>
                        <strong>{formatSessionDate(session.date)}</strong>
                        <small>{session.time} · {session.location}</small>
                      </span>
                    </td>
                    <td data-label="Kehadiran">
                      {session.status === "Draft" ? (
                        <span className={styles.noAttendance}>Belum dimulai</span>
                      ) : (
                        <span className={styles.attendanceCount}>
                          {counts.hadir}<small> / {counts.totalActive}</small>
                        </span>
                      )}
                    </td>
                    <td data-label="Status">
                      <span className={`${styles.statusBadge} ${statusClass}`}>
                        {session.status === "Aktif" ? (
                          <span className={styles.statusPulse} aria-hidden="true" />
                        ) : session.status === "Ditutup" ? (
                          <Check size={12} aria-hidden="true" />
                        ) : (
                          <Clock3 size={12} aria-hidden="true" />
                        )}
                        {session.status}
                      </span>
                    </td>
                    <td data-label="Detail">
                      <Link
                        href={`/attendance/${session.id}`}
                        className={styles.detailsAction}
                      >
                        Detail
                        <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSessions.length === 0 && (
            <div className={styles.emptyState}>
              <span><CircleAlert size={18} aria-hidden="true" /></span>
              <strong>Sesi tidak ditemukan</strong>
              <p>Coba ubah kata kunci atau filter status yang dipilih.</p>
            </div>
          )}
        </div>
      </section>

      {role === "pj-divisi" && (
        <p className={styles.demoNotice}>
          Sebagai PJ, kamu dapat langsung menjalankan sesi saat Ketua Divisi berhalangan. Nama operator selalu tersimpan pada catatan absensi.
        </p>
      )}
    </div>
  );
}
