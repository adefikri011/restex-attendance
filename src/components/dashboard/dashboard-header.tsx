import { Bell, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "@/components/avatar/user-avatar";
import type { AppRoleId } from "@/components/auth/role-config";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import styles from "./dashboard-shell.module.css";

export function DashboardHeader({
  role,
  displayName,
}: {
  role: AppRoleId;
  displayName: string;
}) {
  const pathname = usePathname();
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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
              <strong>2026 — 2027</strong>
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
        <Link
          href="/profile"
          className={styles.headerAvatar}
          aria-label={`Buka profil ${displayName}`}
          aria-current={pathname === "/profile" ? "page" : undefined}
        >
          <UserAvatar
            className={styles.headerAvatarImage}
            initials={initials}
            imageUrl="/api/profile/photo"
          />
        </Link>
      </div>
    </header>
  );
}
