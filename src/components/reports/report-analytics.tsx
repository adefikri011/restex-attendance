import { getSessionCounts, type AttendanceSession } from "@/components/attendance/attendance-data";
import styles from "./reports.module.css";

const statusDetails = [
  { label: "Hadir", key: "Hadir", className: styles.statusPresent },
  { label: "Izin", key: "Izin", className: styles.statusExcused },
  { label: "Sakit", key: "Sakit", className: styles.statusSick },
  { label: "Alpha", key: "Alpha", className: styles.statusAbsent },
] as const;

export function ReportAnalytics({
  sessions,
  totalActive,
  totals,
}: {
  sessions: AttendanceSession[];
  totalActive: number;
  totals: Record<"Hadir" | "Izin" | "Sakit" | "Alpha", number>;
}) {
  const totalRecords = Object.values(totals).reduce((total, count) => total + count, 0);

  return (
    <div className={styles.analyticsGrid}>
      <section className={styles.panel} aria-labelledby="session-attendance-title">
        <div className={styles.panelHeading}>
          <div>
            <span className={styles.sectionEyebrow}>PER SESI</span>
            <h2 id="session-attendance-title">Persentase kehadiran</h2>
          </div>
          <span className={styles.panelHint}>Sesi selesai</span>
        </div>
        {sessions.length ? (
          <div className={styles.sessionBars}>
            {sessions.map((session) => {
              const counts = getSessionCounts(session, totalActive);
              const percentage = counts.totalActive
                ? Math.round((counts.hadir / counts.totalActive) * 100)
                : 0;

              return (
                <div className={styles.sessionBarRow} key={session.id}>
                  <div className={styles.sessionBarLabel}>
                    <span title={session.title}>{session.title}</span>
                    <strong>{percentage}%</strong>
                  </div>
                  <div
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-label={`Kehadiran ${session.title}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyChart}>Belum ada sesi selesai pada rentang ini.</p>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="attendance-distribution-title">
        <div className={styles.panelHeading}>
          <div>
            <span className={styles.sectionEyebrow}>DISTRIBUSI STATUS</span>
            <h2 id="attendance-distribution-title">Catatan kehadiran</h2>
          </div>
          <span className={styles.recordTotal}>{totalRecords} catatan</span>
        </div>
        <div className={styles.distributionBar} aria-label="Distribusi status kehadiran">
          {statusDetails.map((status) => (
            <span
              key={status.key}
              className={status.className}
              style={{
                width: `${totalRecords ? (totals[status.key] / totalRecords) * 100 : 0}%`,
              }}
              title={`${status.label}: ${totals[status.key]}`}
            />
          ))}
        </div>
        <div className={styles.legendList}>
          {statusDetails.map((status) => (
            <div className={styles.legendItem} key={status.key}>
              <span className={status.className} aria-hidden="true" />
              <span>{status.label}</span>
              <strong>{totals[status.key]}</strong>
            </div>
          ))}
        </div>
        {!totalRecords && (
          <p className={styles.emptyChart}>Belum ada catatan kehadiran untuk ditampilkan.</p>
        )}
      </section>
    </div>
  );
}
