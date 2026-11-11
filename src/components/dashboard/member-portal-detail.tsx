import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import type { AttendanceStatus } from "@/components/attendance/attendance-data";
import type {
  MemberAttendanceHistory,
  MemberAttendanceSummary,
} from "@/lib/member-portal-service";
import styles from "./role-dashboard-page.module.css";

const summaryStatuses: Array<{
  status: AttendanceStatus;
  className: string;
  icon: typeof ShieldCheck;
}> = [
  {
    status: "Hadir",
    className: styles.attendancePresent,
    icon: ShieldCheck,
  },
  {
    status: "Izin",
    className: styles.attendanceExcused,
    icon: CalendarDays,
  },
  {
    status: "Sakit",
    className: styles.attendanceSick,
    icon: CalendarDays,
  },
  {
    status: "Alpha",
    className: styles.attendanceAbsent,
    icon: ClipboardList,
  },
];

function getAttendanceBadgeClass(status: AttendanceStatus) {
  if (status === "Hadir") return styles.attendanceBadgeHadir;
  if (status === "Izin") return styles.attendanceBadgeIzin;
  if (status === "Sakit") return styles.attendanceBadgeSakit;
  return styles.attendanceBadgeAlpha;
}

function MemberPortalPageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className={styles.memberDetailHeading}>
      <Link href="/portal/anggota" className={styles.memberBackLink}>
        <ArrowLeft size={15} aria-hidden="true" />
        Kembali ke portal
      </Link>
      <span className={styles.eyebrow}>PORTAL ANGGOTA</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function MemberAttendanceSummaryPage({
  data,
}: {
  data: MemberAttendanceSummary;
}) {
  return (
    <div className={styles.memberDetailPage}>
      <MemberPortalPageHeading
        title="Ringkasan kehadiran"
        description={
          data.memberName
            ? `${data.memberName} · ${data.periodName ?? "Belum ada periode aktif"}`
            : "Rekap kehadiran pribadi pada periode aktif."
        }
      />
      {data.memberName ? (
        <>
          <section className={styles.memberSummaryHighlight}>
            <span className={styles.summaryHighlightIcon} aria-hidden="true">
              <ChartNoAxesCombined size={20} />
            </span>
            <div>
              <span>Tingkat kehadiran</span>
              <strong>
                {data.attendanceRate === null ? "—" : `${data.attendanceRate}%`}
              </strong>
              <p>
                Berdasarkan {data.totalAttendance} sesi yang sudah ditutup pada
                periode ini.
              </p>
            </div>
          </section>
          <section
            className={styles.memberAttendanceGrid}
            aria-label="Jumlah kehadiran berdasarkan status"
          >
            {summaryStatuses.map(({ status, className, icon: Icon }) => (
              <article className={styles.memberAttendanceCard} key={status}>
                <span className={`${styles.attendanceStatusIcon} ${className}`}>
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span>{status}</span>
                <strong>{data.attendanceSummary[status]}</strong>
              </article>
            ))}
          </section>
        </>
      ) : (
        <p className={styles.memberPortalEmpty} role="status">
          Akun ini belum terhubung ke data anggota. Hubungi pengurus untuk
          memastikan akun anggota sudah ditautkan.
        </p>
      )}
    </div>
  );
}

export function MemberAttendanceHistoryPage({
  data,
}: {
  data: MemberAttendanceHistory;
}) {
  return (
    <div className={styles.memberDetailPage}>
      <MemberPortalPageHeading
        title="Riwayat absensi"
        description={
          data.memberName
            ? `${data.memberName} · ${data.periodName ?? "Belum ada periode aktif"}`
            : "Catatan absensi pribadi dari sesi yang sudah ditutup."
        }
      />
      {data.memberName ? (
        <section
          className={styles.memberHistoryPanel}
          aria-labelledby="member-attendance-history-title"
        >
          <div className={styles.panelHeading}>
            <div>
              <h2 id="member-attendance-history-title">Sesi yang sudah ditutup</h2>
              <p>
                Menampilkan hingga 50 catatan terbaru pada periode aktif.
              </p>
            </div>
            <ClipboardList size={18} aria-hidden="true" />
          </div>
          {data.attendance.length ? (
            <ul className={styles.recentSessionList}>
              {data.attendance.map((record) => (
                <li key={record.id}>
                  <div className={styles.sessionSummary}>
                    <strong>{record.title}</strong>
                    <span>
                      {record.division ?? "Seluruh organisasi"} · {record.date}
                    </span>
                  </div>
                  <span
                    className={`${styles.attendanceBadge} ${getAttendanceBadgeClass(
                      record.status,
                    )}`}
                  >
                    {record.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyState}>
              Belum ada catatan absensi pada periode aktif.
            </p>
          )}
        </section>
      ) : (
        <p className={styles.memberPortalEmpty} role="status">
          Akun ini belum terhubung ke data anggota. Hubungi pengurus untuk
          memastikan akun anggota sudah ditautkan.
        </p>
      )}
    </div>
  );
}
