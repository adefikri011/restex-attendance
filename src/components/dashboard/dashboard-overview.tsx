import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CircleAlert,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { ActiveSessionCard } from "./active-session-card";
import { AttendanceChart } from "./attendance-chart";
import { RecentSessions } from "./recent-sessions";
import { StatCard } from "./stat-card";
import styles from "./dashboard.module.css";

const statistics = [
  {
    label: "Anggota aktif",
    value: "42",
    caption: "Dalam periode 2026 — 2027",
    icon: UsersRound,
    tone: "navy" as const,
  },
  {
    label: "Rata-rata kehadiran",
    value: "86%",
    caption: "Naik 7% dibanding bulan lalu",
    icon: UserRoundCheck,
    tone: "green" as const,
    trend: "7%",
  },
  {
    label: "Sesi bulan ini",
    value: "8",
    caption: "2 sesi akan datang",
    icon: CalendarCheck2,
    tone: "rose" as const,
  },
  {
    label: "Perlu tindak lanjut",
    value: "3",
    caption: "Anggota dengan kehadiran rendah",
    icon: CircleAlert,
    tone: "amber" as const,
  },
];

export function DashboardOverview() {
  return (
    <div className={styles.dashboardPage}>
      <div className={styles.pageIntro}>
        <div>
          <p className={styles.eyebrow}>SENIN, 9 NOVEMBER 2026</p>
          <h1>Selamat malam, Fikri <span aria-hidden="true">✦</span></h1>
          <p className={styles.introDescription}>
            Berikut ringkasan aktivitas keanggotaan RESTEX hari ini.
          </p>
        </div>
        <a className={styles.quickAction} href="#active-session">
          <span className={styles.quickActionDot} aria-hidden="true" />
          Lihat sesi berjalan
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>

      <section className={styles.welcomePanel} aria-label="Ringkasan periode aktif">
        <div className={styles.welcomeCopy}>
          <span className={styles.welcomeTag}>PERIODE KEPENGURUSAN</span>
          <h2>Bangun teknologi,<br />hadir bersama.</h2>
          <p>
            Pastikan setiap pertemuan tercatat dan perjalanan anggota terdokumentasi
            dengan baik.
          </p>
          <a href="#recent-sessions" className={styles.welcomeLink}>
            Jelajahi aktivitas
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
        <div className={styles.welcomeSummary}>
          <span className={styles.summaryIcon}>
            <UsersRound size={19} aria-hidden="true" />
          </span>
          <span className={styles.summaryLabel}>ANGGOTA TERDAFTAR</span>
          <strong>42</strong>
          <span className={styles.summaryNote}>di periode 2026 — 2027</span>
          <span className={styles.decorativeOrbit} aria-hidden="true" />
        </div>
        <span className={styles.welcomeDecoration} aria-hidden="true" />
      </section>

      <section className={styles.statsGrid} aria-label="Statistik ringkas">
        {statistics.map((statistic) => (
          <StatCard key={statistic.label} {...statistic} />
        ))}
      </section>

      <div className={styles.insightsGrid}>
        <AttendanceChart />
        <ActiveSessionCard />
      </div>

      <RecentSessions />
      <p className={styles.mockDataNote}>
        Tampilan ini menggunakan data contoh untuk pratinjau UI.
      </p>
    </div>
  );
}
