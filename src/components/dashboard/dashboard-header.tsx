import { Bell, ChevronDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import styles from "./dashboard-shell.module.css";

export function DashboardHeader() {
  const pathname = usePathname();
  const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/attendance": "Monitoring Absensi",
    "/members": "Anggota",
    "/lanyard-card": "Kartu Lanyard",
    "/periods": "Periode",
    "/reports": "Laporan",
    "/audit-log": "Audit Log",
  };
  const pageTitle = pathname.startsWith("/attendance/")
    ? "Detail Sesi"
    : pageTitles[pathname] ?? "Dashboard";

  return (
    <header className={styles.pageHeader}>
      <div className={styles.breadcrumbs} aria-label="Breadcrumb">
        <span>Workspace</span>
        <ChevronRight size={14} aria-hidden="true" />
        <strong>{pageTitle}</strong>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.headerPeriod}>
          <span>Periode aktif</span>
          <strong>2026 — 2027</strong>
          <ChevronDown size={15} aria-hidden="true" />
        </div>
        <span className={styles.headerDivider} aria-hidden="true" />
        <ThemeSwitcher />
        <button
          type="button"
          className={styles.notificationButton}
          aria-label="Notifikasi, belum ada notifikasi baru"
          disabled
        >
          <Bell size={19} strokeWidth={1.8} />
          <span aria-hidden="true" />
        </button>
        <div className={styles.headerAvatar} aria-label="Fikri Ramadhan">
          FR
        </div>
      </div>
    </header>
  );
}
