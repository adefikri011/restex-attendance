"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Plus,
  UsersRound,
} from "lucide-react";
import { PeriodForm } from "./period-form";
import {
  formatPeriodDateRange,
  type PeriodRecord,
  type PeriodStatus,
} from "./periods-data";
import styles from "./periods.module.css";

const statusFilters: Array<"Semua" | PeriodStatus> = [
  "Semua",
  "Selesai",
  "Akan datang",
];

function getStatusClass(status: PeriodStatus) {
  if (status === "Aktif") return styles.statusActive;
  if (status === "Selesai") return styles.statusComplete;
  return styles.statusPlanned;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPeriodRecord(value: unknown): value is PeriodRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.startDate === "string" &&
    typeof value.endDate === "string" &&
    (value.status === "Aktif" ||
      value.status === "Selesai" ||
      value.status === "Akan datang") &&
    typeof value.memberCount === "number" &&
    typeof value.activeMemberCount === "number" &&
    typeof value.sessionCount === "number" &&
    typeof value.attendanceRate === "number"
  );
}

export function PeriodsPage({
  initialPeriods,
  canManagePeriods,
}: {
  initialPeriods: PeriodRecord[];
  canManagePeriods: boolean;
}) {
  const [periods, setPeriods] = useState<PeriodRecord[]>(initialPeriods);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState<"Semua" | PeriodStatus>("Semua");
  const [expandedPeriodId, setExpandedPeriodId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const activePeriod = periods.find((period) => period.status === "Aktif");
  const otherPeriods = periods.filter((period) => period.status !== "Aktif");
  const filteredPeriods = useMemo(
    () =>
      otherPeriods.filter((period) => filter === "Semua" || period.status === filter),
    [filter, otherPeriods],
  );
  const completedCount = periods.filter((period) => period.status === "Selesai").length;
  const plannedCount = periods.filter((period) => period.status === "Akan datang").length;

  async function addPeriod(input: Pick<PeriodRecord, "startDate" | "endDate">) {
    const response = await fetch("/api/periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result: unknown = await response.json();
    if (!response.ok) {
      const error =
        isRecord(result) && typeof result.error === "string"
          ? result.error
          : "Periode gagal disimpan. Coba lagi.";
      throw new Error(error);
    }

    if (!isRecord(result) || !isPeriodRecord(result.period)) {
      throw new Error("Respons server tidak valid. Muat ulang halaman sebelum melanjutkan.");
    }
    const period = result.period;
    setPeriods((currentPeriods) => [period, ...currentPeriods]);
    setIsFormOpen(false);
    setFilter("Semua");
    setNotice(`Periode ${period.name} berhasil disimpan.`);
  }

  function toggleDetails(periodId: string) {
    setExpandedPeriodId((currentId) => (currentId === periodId ? null : periodId));
  }

  return (
    <div className={styles.periodsPage}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>PENGELOLAAN · SIKLUS KEPENGURUSAN</span>
          <h1>Periode</h1>
          <p>
            {canManagePeriods
              ? "Kelola periode aktif, arsip kepengurusan, dan rencana periode berikutnya."
              : "Tinjau periode aktif, arsip kepengurusan, dan rencana periode berikutnya."}
          </p>
        </div>
        {canManagePeriods && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => {
              setNotice("");
              setIsFormOpen((isOpen) => !isOpen);
            }}
          >
            <Plus size={17} aria-hidden="true" />
            Buat periode
          </button>
        )}
      </header>

      {canManagePeriods && isFormOpen && (
        <PeriodForm
          periods={periods}
          onCancel={() => setIsFormOpen(false)}
          onCreate={addPeriod}
        />
      )}

      <p className={styles.visuallyHidden} role="status" aria-live="polite">
        {notice}
      </p>

      <section className={styles.activePeriodCard} aria-labelledby="active-period-title">
        <div className={styles.activeCardTop}>
          <span className={styles.activeIcon} aria-hidden="true">
            <CalendarDays size={20} />
          </span>
          <span
            className={`${styles.statusBadge} ${
              activePeriod ? styles.statusActive : styles.statusComplete
            }`}
          >
            {activePeriod && <span aria-hidden="true" />}
            {activePeriod ? "Periode aktif" : "Belum ada periode aktif"}
          </span>
        </div>
        <div className={styles.activeCardContent}>
          <div className={styles.activeCardCopy}>
            <span className={styles.sectionEyebrow}>
              {activePeriod ? "SEDANG BERJALAN" : "BELUM DITETAPKAN"}
            </span>
            <h2 id="active-period-title">
              {activePeriod?.name ?? "Periode aktif belum tersedia"}
            </h2>
            <p>
              {activePeriod
                ? formatPeriodDateRange(activePeriod.startDate, activePeriod.endDate)
                : "Buat rencana periode terlebih dahulu; aktivasi dikelola terpisah."}
            </p>
          </div>
          {activePeriod && (
            <div className={styles.activeStats} aria-label="Ringkasan periode aktif">
              <div>
                <span>Anggota aktif</span>
                <strong>{activePeriod.activeMemberCount}</strong>
              </div>
              <div>
                <span>Total sesi</span>
                <strong>{activePeriod.sessionCount}</strong>
              </div>
              <div>
                <span>Rata-rata hadir</span>
                <strong>{activePeriod.attendanceRate}%</strong>
              </div>
            </div>
          )}
        </div>
        {activePeriod && (
          <div className={styles.activeCardFooter}>
            <span>
              <CheckCircle2 size={15} aria-hidden="true" />
              Sesi baru akan terhubung ke periode ini
            </span>
            <div>
              <Link href="/members">
                Keanggotaan
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <Link href="/attendance">
                Lihat sesi
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className={styles.summaryGrid} aria-label="Ringkasan periode">
        <article className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <CalendarDays size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Total periode</span>
            <strong>{periods.length}</strong>
          </div>
          <small>Aktif, arsip, dan rencana</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconComplete}`}>
            <CheckCircle2 size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Periode selesai</span>
            <strong>{completedCount}</strong>
          </div>
          <small>Riwayat tersimpan</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconPlanned}`}>
            <Clock3 size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Periode direncanakan</span>
            <strong>{plannedCount}</strong>
          </div>
          <small>Belum diaktifkan</small>
        </article>
      </section>

      <section className={styles.transitionNotice} aria-labelledby="transition-title">
        <span className={styles.transitionIcon} aria-hidden="true">
          <ArrowDownRight size={19} />
        </span>
        <div>
          <h2 id="transition-title">Saat pergantian periode</h2>
          <p>
            Tinjau anggota yang lanjut, cuti, atau demisioner sebelum mengaktifkan
            periode berikutnya. Riwayat dan absensi periode lama tetap menjadi arsip.
          </p>
        </div>
        <Link href="/members">
          Tinjau anggota
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>

      <section className={styles.periodListSection} aria-labelledby="period-list-title">
        <div className={styles.listHeading}>
          <div>
            <span className={styles.sectionEyebrow}>RIWAYAT &amp; RENCANA</span>
            <h2 id="period-list-title">Periode lainnya</h2>
            <p>Periode selesai tetap tersedia sebagai arsip, sedangkan rencana belum aktif.</p>
          </div>
          <label className={styles.filterControl}>
            <span>Filter</span>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as "Semua" | PeriodStatus)}
              aria-label="Filter periode"
            >
              {statusFilters.map((status) => (
                <option key={status} value={status}>
                  {status === "Semua" ? "Semua status" : status}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredPeriods.length > 0 ? (
          <div className={styles.periodList}>
            {filteredPeriods.map((period) => {
              const isExpanded = expandedPeriodId === period.id;

              return (
                <article className={styles.periodCard} key={period.id}>
                  <div className={styles.periodCardMain}>
                    <span className={styles.periodCardIcon} aria-hidden="true">
                      {period.status === "Selesai" ? (
                        <CalendarDays size={18} />
                      ) : (
                        <Clock3 size={18} />
                      )}
                    </span>
                    <div className={styles.periodIdentity}>
                      <div className={styles.periodTitleRow}>
                        <h3>{period.name}</h3>
                        <span className={`${styles.statusBadge} ${getStatusClass(period.status)}`}>
                          {period.status}
                        </span>
                      </div>
                      <p>{formatPeriodDateRange(period.startDate, period.endDate)}</p>
                    </div>
                    <div className={styles.periodQuickStats}>
                      <span>
                        <UsersRound size={14} aria-hidden="true" />
                        {period.memberCount} anggota
                      </span>
                      <span>
                        <CalendarDays size={14} aria-hidden="true" />
                        {period.sessionCount} sesi
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.detailButton}
                      aria-expanded={isExpanded}
                      onClick={() => toggleDetails(period.id)}
                    >
                      {isExpanded ? "Tutup ringkasan" : "Ringkasan"}
                      {isExpanded ? (
                        <ChevronUp size={15} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={15} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className={styles.periodDetails}>
                      <div>
                        <span>Periode</span>
                        <strong>{period.name}</strong>
                      </div>
                      <div>
                        <span>Anggota tercatat</span>
                        <strong>{period.memberCount}</strong>
                      </div>
                      <div>
                        <span>Sesi absensi</span>
                        <strong>{period.sessionCount}</strong>
                      </div>
                      <div>
                        <span>Rata-rata kehadiran</span>
                        <strong>{period.attendanceRate}%</strong>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <CalendarDays size={20} aria-hidden="true" />
            <p>Belum ada periode dengan status ini.</p>
          </div>
        )}
      </section>

    </div>
  );
}
