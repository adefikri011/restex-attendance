import { formatSessionDate, getSessionCounts, type AttendanceSession } from "@/components/attendance/attendance-data";
import { getInitials } from "@/components/members/member-data";
import type { MemberAttendanceSummary } from "./report-data";
import styles from "./reports.module.css";

function getSessionStatusClass(status: AttendanceSession["status"]) {
  if (status === "Ditutup") return styles.badgeComplete;
  if (status === "Aktif") return styles.badgeActive;
  return styles.badgeDraft;
}

export function SessionReportTable({
  sessions,
  totalActive,
}: {
  sessions: AttendanceSession[];
  totalActive: number;
}) {
  return (
    <section className={styles.panel} aria-labelledby="session-report-title">
      <div className={styles.panelHeading}>
        <div>
          <span className={styles.sectionEyebrow}>RIWAYAT KEGIATAN</span>
          <h2 id="session-report-title">Rekap per sesi</h2>
          <p>Sesi aktif dan draft ditampilkan sebagai informasi, bukan bagian dari statistik.</p>
        </div>
        <span className={styles.panelHint}>{sessions.length} sesi</span>
      </div>
      {sessions.length ? (
        <div className={styles.tableScroll}>
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th scope="col">Kegiatan</th>
                <th scope="col">Tanggal</th>
                <th scope="col">Status</th>
                <th scope="col">Hadir</th>
                <th scope="col">Izin</th>
                <th scope="col">Sakit</th>
                <th scope="col">Alpha</th>
                <th scope="col">Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const counts = getSessionCounts(session, totalActive);
                const percentage =
                  session.status === "Ditutup" && totalActive
                    ? Math.round((counts.hadir / totalActive) * 100)
                    : null;

                return (
                  <tr key={session.id}>
                    <td>
                      <strong>{session.title}</strong>
                      <span>{session.type} · {session.id}</span>
                    </td>
                    <td>{formatSessionDate(session.date)}</td>
                    <td>
                      <span className={`${styles.sessionBadge} ${getSessionStatusClass(session.status)}`}>
                        <span aria-hidden="true" />
                        {session.status}
                      </span>
                    </td>
                    <td>{session.status === "Ditutup" ? counts.hadir : "—"}</td>
                    <td>{session.status === "Ditutup" ? counts.izin : "—"}</td>
                    <td>{session.status === "Ditutup" ? counts.sakit : "—"}</td>
                    <td>{session.status === "Ditutup" ? counts.alpha : "—"}</td>
                    <td>
                      {percentage === null ? (
                        <span className={styles.notAvailable}>Belum dihitung</span>
                      ) : (
                        <strong className={styles.attendancePercent}>{percentage}%</strong>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyTable}>
          <p>Tidak ada sesi pada filter ini.</p>
          <span>Coba pilih rentang waktu atau periode yang berbeda.</span>
        </div>
      )}
    </section>
  );
}

export function MemberReportTable({
  summaries,
}: {
  summaries: MemberAttendanceSummary[];
}) {
  return (
    <section className={styles.panel} aria-labelledby="member-report-title">
      <div className={styles.panelHeading}>
        <div>
          <span className={styles.sectionEyebrow}>REKAP ANGGOTA</span>
          <h2 id="member-report-title">Kehadiran per anggota</h2>
          <p>Persentase dihitung dari sesi yang sudah ditutup pada filter terpilih.</p>
        </div>
        <span className={styles.panelHint}>{summaries.length} anggota aktif</span>
      </div>
      {summaries.length ? (
        <div className={styles.tableScroll}>
          <table className={`${styles.reportTable} ${styles.memberTable}`}>
            <thead>
              <tr>
                <th scope="col">Anggota</th>
                <th scope="col">Hadir</th>
                <th scope="col">Izin</th>
                <th scope="col">Sakit</th>
                <th scope="col">Alpha</th>
                <th scope="col">Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((summary) => (
                <tr key={summary.member.id}>
                  <td>
                    <div className={styles.memberIdentity}>
                      <span aria-hidden="true">{getInitials(summary.member.name)}</span>
                      <div>
                        <strong>{summary.member.name}</strong>
                        <span>{summary.member.division}</span>
                      </div>
                    </div>
                  </td>
                  <td>{summary.hadir}</td>
                  <td>{summary.izin}</td>
                  <td>{summary.sakit}</td>
                  <td>{summary.alpha}</td>
                  <td>
                    <div className={styles.memberRate}>
                      <strong>{summary.attendanceRate}%</strong>
                      <span>
                        <span style={{ width: `${summary.attendanceRate}%` }} />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyTable}>
          <p>Belum ada anggota aktif pada periode ini.</p>
        </div>
      )}
    </section>
  );
}
