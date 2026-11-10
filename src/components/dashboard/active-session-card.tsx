import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, UsersRound } from "lucide-react";
import styles from "./dashboard.module.css";

export function ActiveSessionCard() {
  return (
    <section className={`${styles.panel} ${styles.sessionPanel}`} id="active-session">
      <div className={styles.panelHeading}>
        <div>
          <h2>Sesi berjalan</h2>
          <p>Pantau kehadiran secara langsung</p>
        </div>
        <span className={styles.liveBadge}>
          <span aria-hidden="true" />
          LIVE
        </span>
      </div>

      <div className={styles.sessionDetails}>
        <span className={styles.sessionType}>KEGIATAN RUTIN</span>
        <h3>Rapat Rutin Mingguan</h3>
        <div className={styles.sessionMeta}>
          <span>
            <Clock3 size={15} aria-hidden="true" />
            Hari ini, 19.00 WIB
          </span>
          <span>
            <MapPin size={15} aria-hidden="true" />
            Ruang Kreatif RESTEX
          </span>
        </div>
      </div>

      <div className={styles.attendanceProgress}>
        <div className={styles.progressLabels}>
          <span>
            <UsersRound size={15} aria-hidden="true" />
            Kehadiran saat ini
          </span>
          <strong>38 <span>/ 42</span></strong>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label="Kehadiran anggota"
          aria-valuenow={38}
          aria-valuemin={0}
          aria-valuemax={42}
        >
          <span style={{ width: `${(38 / 42) * 100}%` }} />
        </div>
        <p>4 anggota belum tercatat hadir</p>
      </div>

      <Link href="#recent-sessions" className={styles.textLink}>
        Lihat detail sesi
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
    </section>
  );
}
