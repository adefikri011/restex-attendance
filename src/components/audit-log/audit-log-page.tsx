"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  auditCategories,
  formatAuditDate,
  formatAuditTime,
  getAuditCategoryClass,
  type AuditCategory,
  type AuditEvent,
  type AuditLogPageData,
  type AuditRange,
} from "./audit-log-data";
import styles from "./audit-log.module.css";

const rangeOptions: AuditRange[] = ["7 hari", "30 hari", "Semua"];
const categoryStyles: Record<string, string> = {
  membership: styles.categoryMembership,
  attendance: styles.categoryAttendance,
  period: styles.categoryPeriod,
  identity: styles.categoryIdentity,
  access: styles.categoryAccess,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAuditEvent(value: unknown): value is AuditEvent {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.timestamp === "string" &&
    typeof value.actor === "string" &&
    typeof value.actorRole === "string" &&
    auditCategories.includes(value.category as AuditCategory) &&
    typeof value.action === "string" &&
    typeof value.target === "string" &&
    typeof value.targetType === "string" &&
    typeof value.summary === "string" &&
    (value.before === undefined || typeof value.before === "string") &&
    (value.after === undefined || typeof value.after === "string") &&
    (value.reason === undefined || typeof value.reason === "string")
  );
}

function isAuditLogPageData(value: unknown): value is AuditLogPageData {
  return (
    isRecord(value) &&
    Array.isArray(value.events) &&
    value.events.every(isAuditEvent) &&
    typeof value.totalCount === "number" &&
    typeof value.filteredCount === "number" &&
    typeof value.hasMore === "boolean" &&
    typeof value.nextOffset === "number" &&
    isRecord(value.metrics) &&
    typeof value.metrics.totalCount === "number" &&
    typeof value.metrics.recentCount === "number" &&
    typeof value.metrics.actorCount === "number" &&
    typeof value.metrics.categoryCount === "number"
  );
}

export function AuditLogPage({ initialData }: { initialData: AuditLogPageData }) {
  const [range, setRange] = useState<AuditRange>("7 hari");
  const [category, setCategory] = useState<"Semua" | AuditCategory>("Semua");
  const [search, setSearch] = useState("");
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const skippedInitialFetch = useRef(false);
  const currentFilterKey = JSON.stringify([range, category, search]);
  const currentFilterKeyRef = useRef(currentFilterKey);

  useEffect(() => {
    currentFilterKeyRef.current = currentFilterKey;
  }, [currentFilterKey]);

  useEffect(() => {
    if (!skippedInitialFetch.current) {
      skippedInitialFetch.current = true;
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          range,
          category,
          search,
          offset: "0",
        });
        const response = await fetch(`/api/audit-log?${params}`, {
          signal: controller.signal,
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          throw new Error(
            isRecord(result) && typeof result.error === "string"
              ? result.error
              : "Audit log gagal dimuat.",
          );
        }
        if (!isAuditLogPageData(result)) {
          throw new Error("Respons audit log tidak valid.");
        }
        setData(result);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Audit log gagal dimuat. Coba lagi.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, search ? 250 : 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [category, range, search]);

  async function loadMore() {
    if (isLoading || !data.hasMore) return;
    setIsLoading(true);
    setError("");
    const requestFilterKey = currentFilterKey;
    try {
      const params = new URLSearchParams({
        range,
        category,
        search,
        offset: String(data.nextOffset),
      });
      const response = await fetch(`/api/audit-log?${params}`);
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Aktivitas berikutnya gagal dimuat.",
        );
      }
      if (!isAuditLogPageData(result)) {
        throw new Error("Respons audit log tidak valid.");
      }
      if (currentFilterKeyRef.current !== requestFilterKey) return;
      setData((current) => ({
        ...result,
        events: [...current.events, ...result.events],
      }));
    } catch (requestError) {
      if (currentFilterKeyRef.current === requestFilterKey) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Aktivitas berikutnya gagal dimuat.",
        );
      }
    } finally {
      if (currentFilterKeyRef.current === requestFilterKey) setIsLoading(false);
    }
  }

  return (
    <div className={styles.auditPage}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>PENGELOLAAN · JEJAK AKTIVITAS</span>
          <h1>Audit Log</h1>
          <p>Telusuri perubahan penting dan siapa yang melakukannya.</p>
        </div>
        <span className={styles.readOnlyBadge}>
          <ShieldCheck size={15} aria-hidden="true" />
          Riwayat baca-saja
        </span>
      </header>

      <section className={styles.purposeCard} aria-labelledby="audit-purpose-title">
        <span className={styles.purposeIcon} aria-hidden="true">
          <CircleHelp size={18} />
        </span>
        <div>
          <h2 id="audit-purpose-title">Apa fungsi Audit Log?</h2>
          <p>
            Audit Log adalah catatan aktivitas penting, seperti perubahan status anggota,
            pencatatan QR, perubahan akun, serta tindakan pada periode dan divisi. Gunakan untuk
            menelusuri siapa mengubah apa dan kapan jika perlu pemeriksaan.
          </p>
        </div>
        <span className={styles.purposeArrow} aria-hidden="true">
          <ArrowRight size={17} />
        </span>
      </section>

      <section className={styles.metricsGrid} aria-label="Ringkasan aktivitas">
        <article className={styles.metricCard}>
          <span className={styles.metricIcon}>
            <Activity size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Total aktivitas</span>
            <strong>{data.metrics.totalCount}</strong>
          </div>
          <small>Semua waktu</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconGreen}`}>
            <Clock3 size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Aktivitas 7 hari</span>
            <strong>{data.metrics.recentCount}</strong>
          </div>
          <small>Dalam 7 hari terakhir</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconRose}`}>
            <UserRound size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Pelaku tercatat</span>
            <strong>{data.metrics.actorCount}</strong>
          </div>
          <small>Akun tercatat</small>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconAmber}`}>
            <CalendarDays size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Kategori aktivitas</span>
            <strong>{data.metrics.categoryCount}</strong>
          </div>
          <small>Kategori dengan aktivitas</small>
        </article>
      </section>

      <section className={styles.auditPanel} aria-labelledby="activity-list-title">
        <div className={styles.panelHeading}>
          <div>
            <span className={styles.sectionEyebrow}>CATATAN AKTIVITAS</span>
            <h2 id="activity-list-title">Riwayat perubahan</h2>
            <p>Buka detail untuk melihat objek dan nilai perubahan yang tersedia.</p>
          </div>
          <span className={styles.resultCount}>
            {data.filteredCount} aktivitas{isLoading ? " · memuat..." : ""}
          </span>
        </div>

        <div className={styles.filters}>
          <label className={styles.searchField}>
            <Search size={16} aria-hidden="true" />
            <span className={styles.visuallyHidden}>Cari aktivitas</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, aksi, atau data..."
            />
          </label>
          <label className={styles.selectField}>
            <span>Rentang</span>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as AuditRange)}
              aria-label="Filter rentang waktu"
            >
              {rangeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "Semua" ? "Semua waktu" : option}
                </option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <label className={styles.selectField}>
            <span>Kategori</span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as "Semua" | AuditCategory)
              }
              aria-label="Filter kategori"
            >
              <option value="Semua">Semua kategori</option>
              {auditCategories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
        </div>

        {error && <p className={styles.loadError} role="alert">{error}</p>}
        {data.events.length ? (
          <div className={styles.eventList}>
            {data.events.map((event) => {
              const categoryClass = categoryStyles[getAuditCategoryClass(event.category)];

              return (
                <article className={styles.eventCard} key={event.id}>
                  <span className={`${styles.eventMarker} ${categoryClass}`} aria-hidden="true">
                    <Activity size={15} />
                  </span>
                  <div className={styles.eventContent}>
                    <div className={styles.eventTopline}>
                      <span className={`${styles.categoryBadge} ${categoryClass}`}>
                        {event.category}
                      </span>
                      <time className={styles.eventTime} dateTime={event.timestamp}>
                        {formatAuditDate(event.timestamp)} · {formatAuditTime(event.timestamp)} WIB
                      </time>
                    </div>
                    <h3>{event.action}</h3>
                    <p className={styles.eventSummary}>{event.summary}</p>
                    <div className={styles.eventMeta}>
                      <span className={styles.actorAvatar} aria-hidden="true">
                        {event.actor
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <span className={styles.actorName}>{event.actor}</span>
                      <span className={styles.metaDivider} aria-hidden="true">·</span>
                      <span>{event.actorRole}</span>
                      <span className={styles.metaDivider} aria-hidden="true">·</span>
                      <span className={styles.eventTarget}>{event.target}</span>
                    </div>
                    <details className={styles.eventDetails}>
                      <summary>
                        Lihat detail
                        <ChevronDown size={14} aria-hidden="true" />
                      </summary>
                      <div className={styles.detailsContent}>
                        <div>
                          <span>Objek</span>
                          <strong>{event.targetType}</strong>
                        </div>
                        <div>
                          <span>ID aktivitas</span>
                          <strong>{event.id}</strong>
                        </div>
                        {(event.before || event.after) && (
                          <div className={styles.changeValues}>
                            {event.before && (
                              <div>
                                <span>Sebelum</span>
                                <strong>{event.before}</strong>
                              </div>
                            )}
                            {event.after && (
                              <div>
                                <span>Sesudah</span>
                                <strong>{event.after}</strong>
                              </div>
                            )}
                          </div>
                        )}
                        {event.reason && (
                          <div className={styles.reasonDetail}>
                            <span>Alasan / catatan</span>
                            <strong>{event.reason}</strong>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Search size={19} aria-hidden="true" />
            <strong>
              {data.totalCount === 0
                ? "Belum ada aktivitas yang tercatat"
                : "Tidak ada aktivitas yang cocok"}
            </strong>
            <span>
              {data.totalCount === 0
                ? "Aktivitas baru akan muncul setelah tindakan penting dicatat."
                : "Ubah filter atau kata kunci pencarian."}
            </span>
          </div>
        )}
        {data.hasMore && (
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={() => void loadMore()}
            disabled={isLoading}
          >
            {isLoading ? "Memuat..." : "Muat aktivitas berikutnya"}
          </button>
        )}
      </section>

      <aside className={styles.privacyNote}>
        <ShieldCheck size={16} aria-hidden="true" />
        <p>
          Audit Log bersifat baca-saja agar riwayat tidak berubah saat ditinjau.
          <strong> Catatan hanya tersedia sejak pencatatan aktivitas diaktifkan</strong>;
          perubahan lama tidak dibuat ulang secara retroaktif.
        </p>
      </aside>
    </div>
  );
}
