"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  IdCard,
  ShieldCheck,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { AppRoleId } from "@/components/auth/role-config";
import styles from "./role-dashboard-page.module.css";

type DashboardAction = {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  icon: LucideIcon;
};

const roleActions: Record<AppRoleId, DashboardAction[]> = {
  "super-admin": [
    { title: "Akun pengurus", description: "Atur akses dan Ketua Divisi.", href: "/administrator-accounts", actionLabel: "Kelola akun", icon: ShieldCheck },
    { title: "Anggota", description: "Kelola status dan data keanggotaan.", href: "/members", actionLabel: "Lihat anggota", icon: UsersRound },
    { title: "Periode", description: "Tinjau periode aktif dan arsip.", href: "/periods", actionLabel: "Kelola periode", icon: CalendarDays },
    { title: "Laporan", description: "Tinjau rekap kehadiran organisasi.", href: "/reports", actionLabel: "Buka laporan", icon: ChartNoAxesCombined },
    { title: "Audit Log", description: "Telusuri perubahan penting.", href: "/audit-log", actionLabel: "Tinjau aktivitas", icon: ClipboardList },
  ],
  admin: [
    { title: "Anggota", description: "Kelola data dan status keanggotaan.", href: "/members", actionLabel: "Lihat anggota", icon: UsersRound },
    { title: "Periode", description: "Tinjau periode kepengurusan.", href: "/periods", actionLabel: "Lihat periode", icon: CalendarDays },
    { title: "Monitoring absensi", description: "Pantau sesi dari seluruh divisi.", href: "/attendance", actionLabel: "Pantau sesi", icon: ClipboardList },
    { title: "Laporan", description: "Tinjau dan unduh rekap kehadiran.", href: "/reports", actionLabel: "Buka laporan", icon: ChartNoAxesCombined },
    { title: "Audit Log", description: "Lihat jejak perubahan sistem.", href: "/audit-log", actionLabel: "Tinjau aktivitas", icon: ShieldCheck },
  ],
  "ketua-divisi": [
    { title: "Sesi absensi", description: "Buka sesi, scan QR, dan rekap kehadiran divisi.", href: "/attendance", actionLabel: "Kelola sesi", icon: CalendarDays },
    { title: "Anggota divisi", description: "Tinjau data keanggotaan divisi.", href: "/members", actionLabel: "Lihat anggota", icon: UsersRound },
    { title: "Laporan divisi", description: "Tinjau ringkasan kehadiran.", href: "/reports", actionLabel: "Buka laporan", icon: ChartNoAxesCombined },
    { title: "Kartu lanyard", description: "Bantu anggota menyiapkan kartu identitas.", href: "/lanyard-card", actionLabel: "Buka kartu", icon: IdCard },
  ],
  "pj-divisi": [
    { title: "Sesi absensi", description: "Buka sesi dan catat kehadiran anggota divisi.", href: "/attendance", actionLabel: "Kelola sesi", icon: CalendarDays },
    { title: "Kartu lanyard", description: "Bantu anggota menyiapkan kartu identitas.", href: "/lanyard-card", actionLabel: "Buka kartu", icon: IdCard },
  ],
  anggota: [
    { title: "Profil saya", description: "Informasi dan status keanggotaan pribadi.", icon: UserRound },
    { title: "Riwayat absensi", description: "Catatan kehadiran pada sesi yang telah ditutup.", icon: ClipboardList },
    { title: "Ringkasan kehadiran", description: "Rekap Hadir, Izin, Sakit, dan Alpha per periode.", icon: ChartNoAxesCombined },
  ],
};

export function RoleDashboardPage({
  roleId,
  displayName,
}: {
  roleId: AppRoleId;
  displayName: string;
}) {
  const actions = roleActions[roleId];
  const isMember = roleId === "anggota";
  const isSuperAdmin = roleId === "super-admin";
  const memberFirstName = displayName.split(" ")[0];

  return (
    <div className={styles.roleDashboard}>
      <header
        className={`${styles.welcomePanel} ${
          isSuperAdmin ? styles.superAdminWelcome : ""
        }`}
      >
        <span className={styles.welcomeIcon} aria-hidden="true">
          {isMember ? <UserRound size={20} /> : <ShieldCheck size={20} />}
        </span>
        <div>
          <span className={styles.eyebrow}>
            {isMember
              ? "PORTAL ANGGOTA"
              : isSuperAdmin
                ? "RUANG KENDALI ORGANISASI"
                : "RUANG KERJA PENGURUS"}
          </span>
          <h1>
            {isMember
              ? `Halo, ${memberFirstName}`
              : isSuperAdmin
                ? `Selamat datang, ${memberFirstName}`
                : "Selamat datang kembali"}
          </h1>
          <p>
            {roleId === "anggota"
              ? "Akses informasi keanggotaan dan absensi milikmu."
              : isSuperAdmin
                ? "Kelola akses, data anggota, dan aktivitas RESTEX dari satu tempat."
              : "Pilih kebutuhan yang ingin kamu kelola hari ini."}
          </p>
        </div>
        {!isMember && (
          <span className={styles.rolePill}>
            {roleId === "ketua-divisi" || roleId === "pj-divisi"
              ? roleId === "ketua-divisi" ? "Ketua Divisi" : "PJ Divisi"
              : roleId === "super-admin"
                ? "Super Admin"
                : "Admin"}
          </span>
        )}
        {isSuperAdmin && (
          <span className={styles.welcomeDecoration} aria-hidden="true">
            <ShieldCheck size={116} strokeWidth={0.75} />
          </span>
        )}
      </header>

      <section className={styles.sectionHeading} aria-labelledby="role-actions-title">
        <div>
          <span className={styles.eyebrow}>
            {isSuperAdmin ? "PUSAT PENGELOLAAN" : "AKSES SESUAI PERAN"}
          </span>
          <h2 id="role-actions-title">
            {isMember
                ? "Ruang anggota"
                : isSuperAdmin
                  ? "Kelola organisasi"
                  : "Akses cepat"}
          </h2>
          <p>
            {isMember
                ? "Portal ini hanya menampilkan data keanggotaan dan absensimu sendiri."
                : isSuperAdmin
                  ? "Pilih area kerja untuk melanjutkan pengelolaan."
                : "Menu ditampilkan sesuai hak akses akun yang terverifikasi."}
          </p>
        </div>
      </section>

      <div
        className={`${styles.actionGrid} ${
          isSuperAdmin ? styles.superAdminGrid : ""
        }`}
      >
        {actions.map(({ title, description, href, actionLabel, icon: Icon }) => {
          const isFeatured = isSuperAdmin && title === "Akun pengurus";
          const content = (
            <>
                <span
                  className={`${styles.actionIcon} ${
                    isFeatured ? styles.featuredIcon : ""
                  }`}
                  aria-hidden="true"
                >
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                {isFeatured ? (
                  <div className={styles.featuredCopy}>
                    <span className={styles.cardEyebrow}>AKSES &amp; KEAMANAN</span>
                    <strong>{title}</strong>
                    <p>{description}</p>
                    <span className={styles.actionLink}>
                      {actionLabel}
                      <ArrowRight size={14} aria-hidden="true" />
                    </span>
                  </div>
                ) : (
                  <>
                    <strong>{title}</strong>
                    <p>{description}</p>
                    {href ? (
                      <span className={styles.actionLink}>
                        {actionLabel}
                        <ArrowRight size={14} aria-hidden="true" />
                      </span>
                    ) : (
                      <span className={styles.comingSoon}>Segera tersedia</span>
                    )}
                  </>
                )}
                {isFeatured && (
                  <span className={styles.featuredDecoration} aria-hidden="true">
                    <ShieldCheck size={86} strokeWidth={0.8} />
                  </span>
                )}
            </>
          );

          return href ? (
            <Link
                className={`${styles.actionCard} ${
                  isFeatured ? styles.featuredCard : ""
                }`}
                href={href}
                key={title}
            >
                {content}
            </Link>
          ) : (
            <article className={styles.actionCard} key={title}>
              {content}
            </article>
          );
        })}
      </div>

    </div>
  );
}
