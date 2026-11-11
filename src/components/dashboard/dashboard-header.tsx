import { Bell, ChevronDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import type { AppRoleId } from "@/components/auth/role-config";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import styles from "./dashboard-shell.module.css";

export function DashboardHeader({
  role,
  periodName,
}: {
  role: AppRoleId;
  periodName: string | null;
}) {
  const pathname = usePathname();
  const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/attendance": "Monitoring Absensi",
    "/members": "Anggota",
    "/lanyard-card": "Kartu Lanyard",
    "/periods": "Periode",
    "/reports": "Laporan",
    "/audit-log": "Audit Log",
    "/administrator-accounts": "Akun Pengurus",
    "/portal/anggota": "Portal Anggota",
    "/portal/anggota/ringkasan-kehadiran": "Ringkasan Kehadiran",
    "/portal/anggota/riwayat-absensi": "Riwayat Absensi",
    "/profile": "Profil Saya",
  };
  const pageTitle = pathname.startsWith("/attendance/")
    ? "Detail Sesi"
    : pathname.startsWith("/dashboard/")
      ? "Dashboard"
      : pageTitles[pathname] ?? "Dashboard";

  return (
    <header className={styles.pageHeader}>
      <div className={styles.breadcrumbs} aria-label="Breadcrumb">
        <span>Workspace</span>
        <ChevronRight size={14} aria-hidden="true" />
        <strong>{pageTitle}</strong>
      </div>

      <div className={styles.headerActions}>
        {role !== "anggota" && (
          <>
            <div className={styles.headerPeriod}>
              <span>Periode aktif</span>
              <strong>{periodName ?? "Belum ada periode"}</strong>
              <ChevronDown size={15} aria-hidden="true" />
            </div>
            <span className={styles.headerDivider} aria-hidden="true" />
          </>
        )}
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
        <details className={styles.languageMenu}>
          <summary
            className={styles.languageSwitcher}
            aria-label="Bahasa Indonesia, buka pilihan bahasa"
            title="Pilihan bahasa"
          >
            <span className={styles.languageFlag} aria-hidden="true">
              🇮🇩
            </span>
            <span>ID</span>
            <ChevronDown size={13} aria-hidden="true" />
          </summary>
          <div className={styles.languageDropdown}>
            <div className={styles.languageOption} aria-current="true">
              <span aria-hidden="true">🇮🇩</span>
              <span>Bahasa Indonesia</span>
              <span className={styles.languageOptionStatus}>Aktif</span>
            </div>
            <div
              className={`${styles.languageOption} ${styles.languageOptionDisabled}`}
              aria-disabled="true"
              title="Bahasa Inggris masih dalam proses"
            >
              <span aria-hidden="true">🇬🇧</span>
              <span>English</span>
              <span className={styles.languageOptionStatus}>Dalam proses</span>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
