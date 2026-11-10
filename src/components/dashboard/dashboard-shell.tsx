"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  IdCard,
  LayoutDashboard,
  Menu,
  ScrollText,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { DashboardHeader } from "./dashboard-header";
import styles from "./dashboard-shell.module.css";

type DashboardShellProps = {
  children: React.ReactNode;
};

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
};

const primaryNavigation: NavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Sesi Absensi", icon: CalendarDays, href: "/attendance" },
  { label: "Anggota", icon: UsersRound, href: "/members" },
  { label: "Kartu Lanyard", icon: IdCard, href: "/lanyard-card" },
  { label: "Periode", icon: CalendarRange, href: "/periods" },
  { label: "Laporan", icon: ChartNoAxesCombined, href: "/reports" },
];

const managementNavigation: NavigationItem[] = [
  { label: "Audit Log", icon: ScrollText, href: "/audit-log" },
  { label: "Akun Pengurus", icon: Activity, href: "/administrator-accounts" },
];

function NavigationGroup({
  items,
  pathname,
  onNavigate,
}: {
  items: NavigationItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <ul className={styles.navigationList}>
      {items.map(({ label, icon: Icon, href }) => {
        const isActive = pathname === href;

        return (
          <li key={label}>
            {href ? (
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`${styles.navigationItem} ${
                isActive ? styles.activeNavigationItem : ""
              }`}
              onClick={onNavigate}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          ) : (
            <button
              type="button"
              className={styles.navigationItem}
              disabled
              title="Bagian ini akan dibuat pada tahap berikutnya"
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span>{label}</span>
              <span className={styles.comingSoon}>Segera</span>
            </button>
          )}
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const pathname = usePathname();

  function closeNavigation() {
    setIsNavigationOpen(false);
  }

  return (
    <div className={styles.appShell}>
      {isNavigationOpen && (
        <button
          type="button"
          className={styles.mobileOverlay}
          aria-label="Tutup menu navigasi"
          onClick={closeNavigation}
        />
      )}

      <aside
        className={`${styles.sidebar} ${isNavigationOpen ? styles.sidebarOpen : ""}`}
        aria-label="Navigasi utama"
      >
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink} onClick={closeNavigation}>
            <span className={styles.brandMark} aria-hidden="true">
              <Image
                src="/assets/image/logo.jpg"
                alt=""
                width={64}
                height={64}
                priority
                unoptimized
              />
            </span>
            <span className={styles.brandText}>
              <strong aria-label="RESTEX">
                RESTE
                <svg
                  className={styles.brandWordmarkX}
                  viewBox="0 0 36 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M1.5 1C8 3.4 14.7 9 21 13.8L35 23.5C28.2 21.6 21.5 16 15.2 11.2L1.5 1Z" />
                  <path d="M.6 23.3C6.5 18.5 13.5 12.9 20.5 7.6 26.4 3.2 31.8.8 35.7.2 32.3 3.2 27.9 7 22.1 11.8 15.8 17 8.8 22.3 3.1 23.8 2.1 24.1 1.2 23.9.6 23.3Z" />
                </svg>
              </strong>
              <span>ATTENDANCE</span>
            </span>
          </Link>
          <button
            type="button"
            className={styles.closeMenuButton}
            aria-label="Tutup menu"
            onClick={closeNavigation}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.periodCard}>
          <span className={styles.periodLabel}>PERIODE AKTIF</span>
          <strong>2026 — 2027</strong>
          <span className={styles.periodStatus}>
            <span aria-hidden="true" />
            Sedang berjalan
          </span>
        </div>

        <nav className={styles.navigation}>
          <p className={styles.navigationLabel}>MENU UTAMA</p>
          <NavigationGroup
            items={primaryNavigation}
            pathname={pathname}
            onNavigate={closeNavigation}
          />

          <p className={`${styles.navigationLabel} ${styles.managementLabel}`}>
            PENGELOLAAN
          </p>
          <NavigationGroup
            items={managementNavigation}
            pathname={pathname}
            onNavigate={closeNavigation}
          />
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.profileAvatar} aria-hidden="true">
            FR
          </div>
          <div className={styles.profileDetails}>
            <strong>Fikri Ramadhan</strong>
            <span>Super Admin</span>
          </div>
          <span className={styles.profileMenu} aria-hidden="true">
            •••
          </span>
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <div className={styles.mobileTopbar}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Buka menu navigasi"
            aria-expanded={isNavigationOpen}
            onClick={() => setIsNavigationOpen(true)}
          >
            <Menu size={21} />
          </button>
          <span>RESTEX Attendance</span>
        </div>
        <DashboardHeader />
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
