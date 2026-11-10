"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  FilePlus2,
  FileText,
  MapPin,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import { initialMembers } from "@/components/members/member-data";
import styles from "./attendance.module.css";
import {
  createInitialSessions,
  formatSessionDate,
  getActiveMembers,
  getSessionCounts,
  type AttendanceSession,
  type NewSessionInput,
  type SessionStatus,
} from "./attendance-data";
import {
  CreateSessionDialog,
  SessionDetailDialog,
} from "./session-dialogs";

const filters: Array<{ label: string; value: SessionStatus | "Semua" }> = [
  { label: "Semua sesi", value: "Semua" },
  { label: "Aktif", value: "Aktif" },
  { label: "Draft", value: "Draft" },
  { label: "Ditutup", value: "Ditutup" },
];

const activeMembers = getActiveMembers(initialMembers);

function getCurrentTime() {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function AttendancePage() {
  const [sessions, setSessions] = useState(() =>
    createInitialSessions(initialMembers),
  );
  const [selectedFilter, setSelectedFilter] =
    useState<SessionStatus | "Semua">("Semua");
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const activeSession = sessions.find((session) => session.status === "Aktif");
  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  );
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
          const counts = getSessionCounts(session, activeMembers.length);
          return total + (counts.totalActive ? (counts.hadir / counts.totalActive) * 100 : 0);
        }, 0) / closedSessions.length,
      )
    : 0;

  function createSession(input: NewSessionInput) {
    const newSession: AttendanceSession = {
      ...input,
      id: `SES-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      status: "Draft",
      attendance: [],
    };

    setSessions((current) => [newSession, ...current]);
    setIsCreateOpen(false);
    setSelectedFilter("Semua");
    setSearch("");
    setNotice(`${newSession.title} tersimpan sebagai draft di pratinjau.`);
  }

  function startSession(sessionId: string) {
    const existingActiveSession = sessions.find(
      (session) => session.status === "Aktif" && session.id !== sessionId,
    );

    if (existingActiveSession) {
      setNotice(
        `Tutup sesi "${existingActiveSession.title}" sebelum memulai sesi lain.`,
      );
      return;
    }

    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId ? { ...session, status: "Aktif" } : session,
      ),
    );
    setNotice("Sesi dimulai pada pratinjau lokal.");
  }

  function closeSession(sessionId: string) {
    setSessions((current) =>
      current.map((session) => {
        if (session.id !== sessionId) return session;

        const recordedMemberIds = new Set(
          session.attendance.map((entry) => entry.memberId),
        );
        const alphaEntries = activeMembers
          .filter((member) => !recordedMemberIds.has(member.id))
          .map((member) => ({
            memberId: member.id,
            status: "Alpha" as const,
          }));

        return {
          ...session,
          status: "Ditutup",
          attendance: [...session.attendance, ...alphaEntries],
        };
      }),
    );
    setSelectedSessionId(null);
    setNotice(
      "Sesi ditutup. Anggota aktif yang belum tercatat ditandai Alpha pada pratinjau.",
    );
  }

  function recordManualAttendance(
    sessionId: string,
    memberId: string,
    reason: string,
  ) {
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              attendance: [
                ...session.attendance,
                {
                  memberId,
                  status: "Hadir",
                  method: "Manual",
                  reason,
                  time: getCurrentTime(),
                },
              ],
            }
          : session,
      ),
    );
    const member = activeMembers.find((item) => item.id === memberId);
    setNotice(
      `Kehadiran manual ${member?.name ?? "anggota"} dicatat dengan alasan: ${reason}.`,
    );
  }

  return (
    <div className={styles.attendancePage}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>
            KEGIATAN · PERIODE 2026—2027
          </span>
          <h1>Sesi Absensi</h1>
          <p>Atur pertemuan, pantau kehadiran, dan kelola rekap sesi.</p>
        </div>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={17} aria-hidden="true" />
          Buat sesi
        </button>
      </header>

      <p className={styles.liveNotice} role="status" aria-live="polite">
        {notice}
      </p>

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
              <small> / {activeMembers.length}</small>
            </strong>
            <div className={styles.progressTrack}>
              <span
                style={{
                  width: `${getSessionCounts(activeSession, activeMembers.length).totalActive
                    ? (getSessionCounts(activeSession, activeMembers.length).hadir /
                        activeMembers.length) *
                      100
                    : 0}%`,
                }}
              />
            </div>
          </div>
          <button
            type="button"
            className={styles.bannerAction}
            onClick={() => setSelectedSessionId(activeSession.id)}
          >
            Kelola sesi
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </section>
      ) : (
        <section className={styles.emptyBanner} aria-label="Tidak ada sesi aktif">
          <span className={styles.emptyIcon}>
            <CalendarDays size={21} aria-hidden="true" />
          </span>
          <div>
            <h2>Belum ada sesi yang berjalan</h2>
            <p>Buat sesi baru atau mulai salah satu draft yang sudah tersedia.</p>
          </div>
          <button
            type="button"
            className={styles.emptyAction}
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus size={15} aria-hidden="true" />
            Buat sesi
          </button>
        </section>
      )}

      <section className={styles.metricsGrid} aria-label="Ringkasan sesi">
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconNavy}`}>
            <FileText size={17} aria-hidden="true" />
          </span>
          <span className={styles.metricLabel}>Total sesi</span>
          <strong>{sessions.length}</strong>
          <small>Periode 2026—2027</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconGreen}`}>
            <span aria-hidden="true" />
          </span>
          <span className={styles.metricLabel}>Sedang aktif</span>
          <strong>{activeCount}</strong>
          <small>{activeCount ? "Pemindaian dibuka" : "Tidak ada sesi aktif"}</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconAmber}`}>
            <FilePlus2 size={17} aria-hidden="true" />
          </span>
          <span className={styles.metricLabel}>Draft</span>
          <strong>{draftCount}</strong>
          <small>Menunggu dimulai</small>
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
            <p>Daftar sesi pada periode kepengurusan aktif.</p>
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
                <th scope="col" aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => {
                const counts = getSessionCounts(session, activeMembers.length);
                const isBlocked = session.status === "Draft" && Boolean(activeSession);
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
                          <small>{session.type} · {session.id}</small>
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
                    <td data-label="Aksi">
                      {session.status === "Draft" ? (
                        <button
                          type="button"
                          className={styles.rowAction}
                          disabled={isBlocked}
                          title={
                            isBlocked
                              ? "Tutup sesi aktif sebelum memulai sesi lain"
                              : undefined
                          }
                          onClick={() => startSession(session.id)}
                        >
                          Mulai
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.detailsAction}
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          Detail
                          <ArrowRight size={13} aria-hidden="true" />
                        </button>
                      )}
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

      <p className={styles.demoNotice}>
        Data dan tindakan pada halaman ini hanya simulasi lokal; belum tersimpan ke server.
      </p>

      {isCreateOpen && (
        <CreateSessionDialog
          onClose={() => setIsCreateOpen(false)}
          onSubmit={createSession}
        />
      )}
      {selectedSession && (
        <SessionDetailDialog
          session={selectedSession}
          members={initialMembers}
          onClose={() => setSelectedSessionId(null)}
          canStart={!activeSession || activeSession.id === selectedSession.id}
          onStart={startSession}
          onCloseSession={closeSession}
          onManualAttendance={recordManualAttendance}
        />
      )}
    </div>
  );
}
