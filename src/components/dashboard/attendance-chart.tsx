import { ArrowUpRight } from "lucide-react";
import { attendanceByMonth } from "./dashboard-data";
import styles from "./dashboard.module.css";

export function AttendanceChart() {
  return (
    <section className={`${styles.panel} ${styles.chartPanel}`} id="attendance">
      <div className={styles.panelHeading}>
        <div>
          <h2>Tren kehadiran</h2>
          <p>Rata-rata kehadiran anggota per bulan</p>
        </div>
        <span className={styles.chartPeriod}>6 bulan terakhir</span>
      </div>

      <div
        className={styles.chart}
        role="img"
        aria-label="Tren kehadiran naik dari 76 persen pada Juni menjadi 91 persen pada November"
      >
        {attendanceByMonth.map((month) => (
          <div className={styles.chartColumn} key={month.label}>
            <span className={styles.chartValue}>{month.percentage}%</span>
            <div className={styles.chartTrack}>
              <span
                className={styles.chartBar}
                style={{ height: `${month.percentage}%` }}
              />
            </div>
            <span className={styles.chartLabel}>{month.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.chartFooter}>
        <span>
          <span className={styles.legendDot} aria-hidden="true" />
          Tingkat kehadiran
        </span>
        <strong>
          <ArrowUpRight size={14} aria-hidden="true" />
          7% dari bulan lalu
        </strong>
      </div>
    </section>
  );
}
