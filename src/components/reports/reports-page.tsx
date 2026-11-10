"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  CalendarDays,
  CircleCheck,
  Clock3,
  UsersRound,
} from "lucide-react";
import {
  createInitialSessions,
  getActiveMembers,
} from "@/components/attendance/attendance-data";
import { initialMembers } from "@/components/members/member-data";
import { ReportAnalytics } from "./report-analytics";
import { exportAttendanceReport } from "./report-export";
import {
  filterSessionsByRange,
  summarizeMembers,
  summarizeSessions,
  type ReportRange,
} from "./report-data";
import { MemberReportTable, SessionReportTable } from "./report-tables";
import styles from "./reports.module.css";

const periodOptions = [
  { id: "2026-2027", label: "2026 — 2027 · Aktif" },
  { id: "2025-2026", label: "2025 — 2026 · Arsip" },
];

const rangeOptions: ReportRange[] = [
  "Bulan ini",
  "Semester I",
  "Seluruh periode",
];

const allSessions = createInitialSessions(initialMembers);
const activeMembers = getActiveMembers(initialMembers);

export function ReportsPage() {
  const [periodId, setPeriodId] = useState(periodOptions[0].id);
  const [range, setRange] = useState<ReportRange>("Bulan ini");
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState("");

  const isCurrentPeriod = periodId === periodOptions[0].id;
  const sessions = useMemo(
    () => filterSessionsByRange(isCurrentPeriod ? allSessions : [], range),
    [isCurrentPeriod, range],
  );
  const summary = summarizeSessions(sessions, activeMembers.length);
  const memberSummaries = summary.completedSessions.length
    ? summarizeMembers(activeMembers, summary.completedSessions)
    : [];
  const selectedPeriod = periodOptions.find((period) => period.id === periodId)!;

  async function handleExport() {
    if (!sessions.length || isExporting) return;

    setNotice("");
    setIsExporting(true);
    try {
      await exportAttendanceReport({
        periodName: selectedPeriod.label.split(" · ")[0],
        rangeLabel: range,
        sessions,
        memberSummaries,
      });
      setNotice("File Excel berhasil diunduh.");
    } catch (error) {
      console.error("Gagal mengekspor laporan absensi.", error);
      setNotice("Laporan gagal diekspor. Silakan coba kembali.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className={styles.reportsPage}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>ANALISIS · KEHADIRAN ANGGOTA</span>
          <h1>Laporan</h1>
          <p>Tinjau rekap kehadiran per sesi dan perkembangan anggota.</p>
        </div>
        <button
          type="button"
          className={styles.exportButton}
          onClick={handleExport}
          disabled={!sessions.length || isExporting}
          title={!sessions.length ? "Tidak ada data untuk diekspor" : "Unduh laporan Excel"}
        >
          <ArrowDownToLine size={16} aria-hidden="true" />
          {isExporting ? "Menyiapkan..." : "Export Excel"}
        </button>
      </header>

      <section className={styles.filterPanel} aria-label="Filter laporan">
        <div className={styles.filterIntro}>
          <span className={styles.filterIcon} aria-hidden="true">
            <CalendarDays size={17} />
          </span>
          <div>
            <strong>Atur laporan</strong>
            <span>Pilih periode dan rentang waktu</span>
          </div>
        </div>
        <label className={styles.filterField}>
          <span>Periode</span>
          <select
            value={periodId}
            onChange={(event) => setPeriodId(event.target.value)}
          >
            {periodOptions.map((period) => (
              <option value={period.id} key={period.id}>
                {period.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterField}>
          <span>Rentang waktu</span>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as ReportRange)}
          >
            {rangeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.filterResult}>
          {sessions.length} sesi ditemukan
        </span>
      </section>

      <p className={styles.liveNotice} role="status" aria-live="polite">
        {notice}
      </p>

      <section className={styles.metricsGrid} aria-label="Ringkasan laporan">
        <article className={styles.metricCard}>
          <span className={styles.metricIcon}>
            <CalendarDays size={17} aria-hidden="true" />
          </span>
          <span>Total sesi</span>
          <strong>{summary.totalSessions}</strong>
          <small>{summary.completedCount} sesi selesai dihitung</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconGreen}`}>
            <CircleCheck size={17} aria-hidden="true" />
          </span>
          <span>Rata-rata kehadiran</span>
          <strong>{summary.averageAttendance}%</strong>
          <small>Dari sesi yang sudah ditutup</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconRose}`}>
            <UsersRound size={17} aria-hidden="true" />
          </span>
          <span>Catatan hadir</span>
          <strong>{summary.totals.Hadir}</strong>
          <small>{summary.attendanceRecords} kesempatan absensi</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconAmber}`}>
            <Clock3 size={17} aria-hidden="true" />
          </span>
          <span>Belum selesai</span>
          <strong>{summary.activeSessions + summary.draftSessions}</strong>
          <small>{summary.activeSessions} aktif · {summary.draftSessions} draft</small>
        </article>
      </section>

      <ReportAnalytics
        sessions={summary.completedSessions}
        totalActive={activeMembers.length}
        totals={summary.totals}
      />
      <SessionReportTable sessions={sessions} totalActive={activeMembers.length} />
      <MemberReportTable summaries={memberSummaries} />

      <p className={styles.previewNote}>
        Statistik hanya menghitung sesi yang ditutup. Laporan ini menggunakan data
        contoh pratinjau UI dan belum terhubung ke database.
      </p>
    </div>
  );
}
