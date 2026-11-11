"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  CalendarDays,
  CircleCheck,
  Clock3,
  UsersRound,
} from "lucide-react";
import { isAttendanceSession } from "@/components/attendance/attendance-data";
import type { Member } from "@/components/members/member-data";
import { ReportAnalytics } from "./report-analytics";
import { exportAttendanceReport } from "./report-export";
import {
  summarizeMembers,
  summarizeSessions,
  type ReportPageData,
  type ReportPeriodOption,
  type ReportRange,
} from "./report-data";
import { MemberReportTable, SessionReportTable } from "./report-tables";
import styles from "./reports.module.css";

const rangeOptions: ReportRange[] = [
  "Bulan ini",
  "Semester I",
  "Seluruh periode",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReportPageData(value: unknown): value is ReportPageData {
  return (
    isRecord(value) &&
    Array.isArray(value.periods) &&
    value.periods.every(
      (period): period is ReportPeriodOption =>
        isRecord(period) &&
        typeof period.id === "string" &&
        typeof period.name === "string" &&
        typeof period.label === "string" &&
        typeof period.startDate === "string" &&
        typeof period.endDate === "string",
    ) &&
    typeof value.selectedPeriodId === "string" &&
    Array.isArray(value.sessions) &&
    value.sessions.every(isAttendanceSession) &&
    Array.isArray(value.members) &&
    value.members.every(
      (member): member is Member =>
        isRecord(member) &&
        typeof member.id === "string" &&
        typeof member.name === "string" &&
        typeof member.email === "string" &&
        typeof member.nim === "string" &&
        typeof member.division === "string" &&
        typeof member.cohort === "string" &&
        (member.status === "Aktif" ||
          member.status === "Cuti" ||
          member.status === "Keluar" ||
          member.status === "Alumni") &&
        typeof member.joinedAt === "string",
    )
  );
}

export function ReportsPage({ initialData }: { initialData: ReportPageData }) {
  const [data, setData] = useState(initialData);
  const [periodId, setPeriodId] = useState(initialData.selectedPeriodId);
  const [range, setRange] = useState<ReportRange>("Bulan ini");
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const skippedInitialFetch = useRef(false);

  useEffect(() => {
    if (!skippedInitialFetch.current) {
      skippedInitialFetch.current = true;
      return;
    }
    if (!periodId) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ periodId, range });
        const response = await fetch(`/api/reports?${params}`, {
          signal: controller.signal,
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            isRecord(result) && typeof result.error === "string"
              ? result.error
              : "Laporan gagal dimuat.",
          );
        }
        if (!isReportPageData(result)) {
          throw new Error("Respons laporan tidak valid.");
        }
        setData(result);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Laporan gagal dimuat. Coba lagi.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [periodId, range]);

  const sessions = data.sessions;
  const activeMembers = data.members;
  const summary = summarizeSessions(sessions, activeMembers.length);
  const memberSummaries = summary.completedSessions.length
    ? summarizeMembers(activeMembers, summary.completedSessions)
    : [];
  const selectedPeriod = data.periods.find((period) => period.id === periodId);

  async function handleExport() {
    if (!sessions.length || !selectedPeriod || isExporting) return;

    setNotice("");
    setIsExporting(true);
    try {
      await exportAttendanceReport({
        periodName: selectedPeriod.name,
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
            disabled={!data.periods.length || isLoading}
          >
            {data.periods.map((period) => (
              <option value={period.id} key={period.id}>
                {period.label}
              </option>
            ))}
            {!data.periods.length && <option value="">Belum ada periode</option>}
          </select>
        </label>
        <label className={styles.filterField}>
          <span>Rentang waktu</span>
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as ReportRange)}
            disabled={!periodId || isLoading}
          >
            {rangeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.filterResult}>
          {isLoading ? "Memuat laporan..." : `${sessions.length} sesi ditemukan`}
        </span>
      </section>

      {error && <p className={styles.liveNotice} role="alert">{error}</p>}
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
        Statistik kehadiran hanya menghitung sesi yang ditutup. Data diperbarui
        berdasarkan periode dan rentang waktu yang dipilih.
      </p>
    </div>
  );
}
