"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { appRoles, type AppRoleId } from "@/components/auth/role-config";
import { UserAvatar } from "@/components/avatar/user-avatar";
import { authClient } from "@/lib/auth-client";
import { MemberDialog } from "@/components/members/member-dialog";
import { DashboardHeader } from "./dashboard-header";
import styles from "./dashboard-shell.module.css";

type DashboardShellProps = {
  children: React.ReactNode;
  role: AppRoleId;
  displayName: string;
};

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
};

const primaryNavigation: NavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
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
        const isActive =
          pathname === href ||
          (label === "Dashboard" && Boolean(href && pathname.startsWith(`${href}/`)));

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

export function DashboardShell({
  children,
  role,
  displayName,
}: DashboardShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activePeriodName, setActivePeriodName] = useState<string | null>(null);
  const [periodLoadState, setPeriodLoadState] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const pathname = usePathname();
  const router = useRouter();
  const activeRole = appRoles.find((item) => item.id === role)!;

  useEffect(() => {
    if (role === "anggota") return;

    let isCurrent = true;

    async function loadActivePeriod() {
      try {
        const response = await fetch("/api/periods/active", {
          cache: "no-store",
        });
        const result: unknown = await response.json();
        if (
          !response.ok ||
          typeof result !== "object" ||
          result === null ||
          !("periodName" in result) ||
          (typeof result.periodName !== "string" && result.periodName !== null)
        ) {
          throw new Error("Periode aktif gagal dimuat.");
        }

        if (isCurrent) {
          setActivePeriodName(result.periodName);
          setPeriodLoadState("ready");
        }
      } catch (error) {
        console.error("Active period request failed.", error);
        if (isCurrent) setPeriodLoadState("error");
      }
    }

    void loadActivePeriod();
    return () => {
      isCurrent = false;
    };
  }, [role]);

  const dashboardItem = {
    ...primaryNavigation[0],
    label: activeRole.id === "anggota" ? "Portal Anggota" : "Dashboard",
    href: activeRole.dashboardPath,
  };
  const visiblePrimaryNavigation =
    activeRole.id === "super-admin"
      ? [dashboardItem, ...primaryNavigation.slice(1)]
      : activeRole.id === "admin"
        ? [dashboardItem, ...primaryNavigation.slice(1)]
        : activeRole.id === "ketua-divisi"
          ? [
              dashboardItem,
              ...primaryNavigation.filter(({ label }) =>
                ["Sesi Absensi", "Kartu Lanyard", "Laporan"].includes(label),
              ),
            ]
          : activeRole.id === "pj-divisi"
            ? [
                dashboardItem,
                ...primaryNavigation.filter(({ label }) =>
                  ["Sesi Absensi", "Kartu Lanyard"].includes(label),
                ),
              ]
          : [dashboardItem];
  const visibleManagementNavigation =
    activeRole.id === "super-admin"
      ? managementNavigation
      : activeRole.id === "admin"
        ? managementNavigation.filter(({ label }) => label === "Audit Log")
        : [];
  const profileInitials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  function closeNavigation() {
    setIsNavigationOpen(false);
  }

  async function handleSignOut() {
    setLogoutError("");
    setIsSigningOut(true);

    try {
      const { error } = await authClient.signOut();
      if (error) {
        console.error("Sign out request failed.", error);
        setLogoutError("Tidak dapat keluar. Silakan coba kembali.");
        return;
      }

      setIsLogoutDialogOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out request failed.", error);
      setLogoutError("Layanan autentikasi tidak dapat dihubungi.");
    } finally {
      setIsSigningOut(false);
    }
  }

  function closeLogoutDialog() {
    if (isSigningOut) return;
    setIsLogoutDialogOpen(false);
    setLogoutError("");
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
          <Link
            href={activeRole.dashboardPath}
            className={styles.brandLink}
            onClick={closeNavigation}
          >
            <span className={styles.brandMark} aria-hidden="true">
              <Image
                src="/assets/image/Logo.png"
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

        {activeRole.id !== "anggota" && (
          <div className={styles.periodCard}>
            <span className={styles.periodLabel}>PERIODE AKTIF</span>
            <strong>
              {activePeriodName ??
                (periodLoadState === "loading"
                  ? "Memuat..."
                  : periodLoadState === "error"
                    ? "Tidak dapat dimuat"
                    : "Belum ada periode")}
            </strong>
            <span className={styles.periodStatus}>
              {activePeriodName && <span aria-hidden="true" />}
              {activePeriodName
                ? "Sedang berjalan"
                : periodLoadState === "error"
                  ? "Status tidak tersedia"
                  : "Tidak ada periode aktif"}
            </span>
          </div>
        )}

        <nav className={styles.navigation}>
          <p className={styles.navigationLabel}>MENU UTAMA</p>
          <NavigationGroup
            items={visiblePrimaryNavigation}
            pathname={pathname}
            onNavigate={closeNavigation}
          />

          {visibleManagementNavigation.length > 0 && (
            <>
              <p className={`${styles.navigationLabel} ${styles.managementLabel}`}>
                PENGELOLAAN
              </p>
              <NavigationGroup
                items={visibleManagementNavigation}
                pathname={pathname}
                onNavigate={closeNavigation}
              />
            </>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link
            href="/profile"
            className={styles.profileLink}
            aria-current={pathname === "/profile" ? "page" : undefined}
            onClick={closeNavigation}
          >
            <UserAvatar
              className={styles.profileAvatar}
              initials={profileInitials}
              imageUrl="/api/profile/photo"
            />
            <span className={styles.profileDetails}>
              <strong>{displayName}</strong>
              <span>{activeRole.label}</span>
            </span>
          </Link>
          <button
            type="button"
            className={styles.profileMenu}
            aria-label="Keluar dari akun"
            title="Keluar dari akun"
            onClick={() => {
              setLogoutError("");
              setIsLogoutDialogOpen(true);
            }}
          >
            <LogOut size={17} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {isLogoutDialogOpen && (
        <MemberDialog
          labelledBy="logout-dialog-title"
          onClose={closeLogoutDialog}
          className={styles.logoutDialog}
        >
          <div className={styles.logoutDialogContent}>
            <div className={styles.logoutMascot}>
              <Image
                src="/assets/mascot/warningg.png"
                alt=""
                width={144}
                height={144}
                unoptimized
              />
            </div>
            <span className={styles.logoutEyebrow}>KONFIRMASI AKUN</span>
            <h2 id="logout-dialog-title">Yakin ingin keluar?</h2>
            <p className={styles.logoutMessage}>
              Sesi RESTEX Attendance akan diakhiri. Kamu bisa masuk kembali
              kapan saja.
            </p>
            {logoutError && (
              <p className={styles.logoutError} role="alert">
                {logoutError}
              </p>
            )}
            <div className={styles.logoutActions}>
              <button
                type="button"
                className={styles.logoutCancel}
                onClick={closeLogoutDialog}
                disabled={isSigningOut}
                data-autofocus
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.logoutConfirm}
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut size={15} aria-hidden="true" />
                {isSigningOut ? "Sedang keluar..." : "Ya, keluar"}
              </button>
            </div>
          </div>
        </MemberDialog>
      )}

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
        <DashboardHeader
          role={activeRole.id}
          periodName={
            activePeriodName ??
            (periodLoadState === "loading"
              ? "Memuat..."
              : periodLoadState === "error"
                ? "Tidak dapat dimuat"
                : null)
          }
        />
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
