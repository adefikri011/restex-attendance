"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  FileText,
  MapPin,
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
  type SessionStatus,
} from "./attendance-data";

const filters: Array<{ label: string; value: SessionStatus | "Semua" }> = [
  { label: "Semua sesi", value: "Semua" },
  { label: "Aktif", value: "Aktif" },
  { label: "Draft", value: "Draft" },
  { label: "Ditutup", value: "Ditutup" },
];

const activeMembers = getActiveMembers(initialMembers);
const sessions = createInitialSessions(initialMembers);

export function AttendancePage() {
  const [selectedFilter, setSelectedFilter] =
    useState<SessionStatus | "Semua">("Semua");
  const [search, setSearch] = useState("");

  const activeSession = sessions.find((session) => session.status === "Aktif");
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
    [normalizedSearch, selectedFilter],
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

  return (
      <div className={styles.attendancePage}>
        <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>
            MONITORING · PERIODE 2026—2027
          </span>
          <h1>Monitoring Absensi</h1>
          <p>Pantau sesi yang berlangsung dan tinjau rekap kehadiran anggota.</p>
        </div>
      </header>

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
          <Link
            href={`/attendance/${activeSession.id}`}
            className={styles.bannerAction}
          >
            Pantau detail
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
            <p>Sesi aktif akan muncul di sini setelah Operator memulainya.</p>
          </div>
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
          <small>Menunggu Operator memulai</small>
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
            <p>Admin memiliki akses baca untuk seluruh sesi pada periode aktif.</p>
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
                const counts = getSessionCounts(session, activeMembers.length);
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

      <p className={styles.demoNotice}>
        Tampilan ini menggunakan data pratinjau lokal. Sesi dan absensi dikelola Operator.
      </p>
    </div>
  );
}
