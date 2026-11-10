import { ArrowRight, Check, Clock3, FileText } from "lucide-react";
import Link from "next/link";
import { recentSessions } from "./dashboard-data";
import styles from "./dashboard.module.css";

const statusClassNames = {
  Selesai: styles.completedStatus,
  Aktif: styles.activeStatus,
  Draft: styles.draftStatus,
};

export function RecentSessions() {
  return (
    <section className={`${styles.panel} ${styles.recentPanel}`} id="recent-sessions">
      <div className={styles.panelHeading}>
        <div>
          <h2>Sesi absensi terbaru</h2>
          <p>Aktivitas sesi pada periode ini</p>
        </div>
        <Link href="#recent-sessions" className={styles.viewAllLink}>
          Lihat semua
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.tableScroller}>
        <table className={styles.sessionsTable}>
          <thead>
            <tr>
              <th scope="col">Nama sesi</th>
              <th scope="col">Tanggal</th>
              <th scope="col">Kehadiran</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentSessions.map((session) => (
              <tr key={session.name}>
                <td>
                  <span className={styles.sessionNameCell}>
                    <span className={styles.sessionRowIcon}>
                      <FileText size={16} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{session.name}</strong>
                      <small>{session.type}</small>
                    </span>
                  </span>
                </td>
                <td className={styles.dateCell}>
                  <Clock3 size={14} aria-hidden="true" />
                  {session.date}
                </td>
                <td className={styles.attendanceCell}>{session.attendance}</td>
                <td>
                  <span className={`${styles.statusBadge} ${statusClassNames[session.status]}`}>
                    {session.status === "Selesai" ? (
                      <Check size={13} aria-hidden="true" />
                    ) : (
                      <span className={styles.statusDot} aria-hidden="true" />
                    )}
                    {session.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
