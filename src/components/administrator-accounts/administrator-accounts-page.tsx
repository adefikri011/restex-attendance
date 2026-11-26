"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  KeyRound,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { UserAvatar } from "@/components/avatar/user-avatar";
import { InviteAdministratorForm } from "./invite-administrator-form";
import { initialAccountPassword } from "@/lib/account-credentials";
import {
  getAdministratorInitials,
  administratorRoles,
  type AdministratorAccount,
  type AdministratorAccountStatus,
  type AdministratorRole,
} from "./administrator-account-data";
import styles from "./administrator-accounts.module.css";
import { notifications } from "@/lib/notifications";

type RoleFilter = "Semua" | AdministratorRole;
type StatusFilter = "Semua" | AdministratorAccountStatus;

type AdministratorAccountsPageProps = {
  accounts: AdministratorAccount[];
  periodName: string | null;
};

const roleDescriptions: Array<{
  role: AdministratorRole | "Anggota";
  title: string;
  description: string;
  icon: typeof Shield;
  className: string;
}> = [
  {
    role: "Super Admin",
    title: "Super Admin",
    description: "Akses penuh ke akun pengurus, anggota, periode, sesi, dan laporan.",
    icon: ShieldCheck,
    className: styles.roleSuperAdmin,
  },
  {
    role: "Admin",
    title: "Admin",
    description: "Menjalankan tugas sekretariat: administrasi anggota, periode, laporan, dan audit.",
    icon: KeyRound,
    className: styles.roleAdmin,
  },
  {
    role: "Anggota",
    title: "Anggota",
    description: "Melihat profil dan riwayat absensi milik sendiri.",
    icon: UserRound,
    className: styles.roleMember,
  },
];

function getRoleClass(role: AdministratorRole) {
  if (role === "Super Admin") return styles.roleBadgeSuperAdmin;
  return styles.roleBadgeAdmin;
}

function getStatusClass(status: AdministratorAccountStatus) {
  if (status === "Aktif") return styles.statusActive;
  return styles.statusDisabled;
}

export function AdministratorAccountsPage({
  accounts: initialAccounts,
  periodName,
}: AdministratorAccountsPageProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("Semua");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<AdministratorRole>("Admin");
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("id");

    return accounts.filter((account) => {
      const matchesSearch =
        !normalizedSearch ||
        [account.name, account.email, account.role, account.division ?? ""]
          .join(" ")
          .toLocaleLowerCase("id")
          .includes(normalizedSearch);
      const matchesRole = roleFilter === "Semua" || account.role === roleFilter;
      const matchesStatus = statusFilter === "Semua" || account.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [accounts, roleFilter, search, statusFilter]);

  const activeCount = accounts.filter((account) => account.status === "Aktif").length;
  const inactiveCount = accounts.filter((account) => account.status === "Nonaktif").length;

  function addCreatedAccount(result: {
    account: AdministratorAccount;
    initialPassword: string;
  }) {
    setAccounts((currentAccounts) => [result.account, ...currentAccounts]);
    setIsInviteOpen(false);
    setRoleFilter("Semua");
    setStatusFilter("Semua");
    setSearch("");
    setCreatedCredentials({
      email: result.account.email,
      password: result.initialPassword,
    });
    notifications.success(
      "Akun administrator berhasil dibuat",
      `${result.account.name} sudah dapat mengakses sistem.`,
    );
  }

  async function toggleAccountStatus(accountId: string) {
    const selectedAccount = accounts.find((account) => account.id === accountId);
    if (!selectedAccount || selectedAccount.role === "Super Admin") return;

    const isActive = selectedAccount.status !== "Aktif";
    try {
      const response = await fetch(`/api/administrator-accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        notifications.error(
          "Status akun administrator gagal diperbarui",
          typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
            ? result.error
            : "Status akun gagal diperbarui.",
        );
        return;
      }
      const nextStatus: AdministratorAccountStatus = isActive ? "Aktif" : "Nonaktif";
      setAccounts((currentAccounts) =>
        currentAccounts.map((account) =>
          account.id === accountId ? { ...account, status: nextStatus } : account,
        ),
      );
      notifications.success(
        "Status akun administrator diperbarui",
        `${selectedAccount.name} sekarang ${nextStatus.toLocaleLowerCase("id")}.`,
      );
    } catch (error) {
      console.error("Administrator account status update failed.", error);
      notifications.error(
        "Status akun administrator gagal diperbarui",
        "Layanan akun administrator tidak dapat dihubungi.",
      );
    }
  }

  return (
    <div className={styles.accountsPage}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>PENGELOLAAN · AKSES ORGANISASI</span>
          <h1>Akun Administrator</h1>
          <p>
            Kelola role Super Admin dan Admin. Untuk membuat akun pengurus sekaligus menetapkan
            jabatannya, buka <Link href="/access-control">Susunan per periode</Link>.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => {
            setCreatedCredentials(null);
            setInviteRole("Admin");
            setIsInviteOpen((isOpen) => !isOpen);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Buat akun administrator
        </button>
      </header>

      {isInviteOpen && (
        <InviteAdministratorForm
          periodName={periodName}
          initialRole={inviteRole}
          onCancel={() => setIsInviteOpen(false)}
          onCreated={addCreatedAccount}
        />
      )}

      {createdCredentials && (
        <aside className={styles.previewNote} role="status">
          <ShieldCheck size={15} aria-hidden="true" />
          <p>
            Akun berhasil dibuat. Email: <strong>{createdCredentials.email}</strong>
            {" · "}Password awal: <code>{createdCredentials.password}</code>
            {" "}Berikan kredensial ini langsung kepada pengurus.
          </p>
        </aside>
      )}

      <section className={styles.summaryGrid} aria-label="Ringkasan akun administrator">
        <article className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Total akun administrator</span>
            <strong>{accounts.length}</strong>
          </div>
          <small>Semua status akun</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconGreen}`}>
            <BadgeCheck size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Akun aktif</span>
            <strong>{activeCount}</strong>
          </div>
          <small>Dapat mengakses sistem</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconAmber}`}>
            <Clock3 size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Akun nonaktif</span>
            <strong>{inactiveCount}</strong>
          </div>
          <small>Akses sistem dimatikan</small>
        </article>
      </section>

      <section className={styles.accessSection} aria-labelledby="access-guide-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>PEMBAGIAN AKSES</span>
            <h2 id="access-guide-title">Siapa bisa melakukan apa?</h2>
            <p>Hak akses sistem diatur berdasarkan role dan penugasan periode.</p>
          </div>
          <CircleHelp className={styles.helpIcon} size={17} aria-hidden="true" />
        </div>
        <div className={styles.roleGrid}>
          {roleDescriptions.map(({ role, title, description, icon: Icon, className }) => (
            <article className={styles.roleCard} key={role}>
              <span className={`${styles.roleIcon} ${className}`}>
                <Icon size={16} aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.accountSection} aria-labelledby="account-list-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>AKUN &amp; UNDANGAN</span>
            <h2 id="account-list-title">Daftar akun administrator</h2>
            <p>Akun pengurus lain dibuat dari Susunan per periode dan dikelola lewat halaman Anggota.</p>
          </div>
          <span className={styles.listCount}>{filteredAccounts.length} akun</span>
        </div>

        <div className={styles.filters}>
          <label className={styles.searchBox}>
            <Search size={16} aria-hidden="true" />
            <span className={styles.visuallyHidden}>Cari akun</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau email..."
            />
          </label>
          <label className={styles.filterSelect}>
            <span>Role akun</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              aria-label="Filter role akun"
            >
              <option value="Semua">Semua role</option>
              {administratorRoles.map((role) => (
                <option value={role} key={role}>{role}</option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <label className={styles.filterSelect}>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              aria-label="Filter status"
            >
              <option value="Semua">Semua status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
        </div>

        <div className={styles.accountList}>
          {filteredAccounts.length ? (
            filteredAccounts.map((account) => (
              <article className={styles.accountRow} key={account.id}>
                <UserAvatar
                  className={styles.accountAvatar}
                  initials={getAdministratorInitials(account.name)}
                  imageUrl={account.photoUrl}
                />
                <div className={styles.accountIdentity}>
                  <strong>{account.name}</strong>
                  <span>{account.email}</span>
                </div>
                <div className={styles.accountRole}>
                  <span className={`${styles.roleBadge} ${getRoleClass(account.role)}`}>
                    {account.role}
                  </span>
                  {account.division && <small>{account.division}</small>}
                </div>
                <span className={`${styles.accountStatus} ${getStatusClass(account.status)}`}>
                  <span aria-hidden="true" />
                  {account.status}
                </span>
                <div className={styles.accountLastActive}>
                  <span>Login terakhir</span>
                  <strong>{account.lastActiveAt ?? "Belum pernah login"}</strong>
                </div>
                {account.role === "Super Admin" ? (
                  <span className={styles.protectedAccount}>
                    <Shield size={15} aria-hidden="true" />
                    Terlindungi
                  </span>
                ) : (
                  <button
                    type="button"
                    className={account.status === "Aktif" ? styles.deactivateButton : styles.activateButton}
                    onClick={() => toggleAccountStatus(account.id)}
                    aria-label={`${account.status === "Aktif" ? "Nonaktifkan" : "Aktifkan kembali"} ${account.name}`}
                  >
                    {account.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                )}
              </article>
            ))
          ) : (
            <div className={styles.emptyState}>
              <Search size={18} aria-hidden="true" />
              <strong>Akun tidak ditemukan</strong>
              <span>Coba ubah pencarian atau filter.</span>
            </div>
          )}
        </div>
      </section>

      <aside className={styles.previewNote}>
        <ShieldCheck size={15} aria-hidden="true" />
        <p>
          Password awal ({initialAccountPassword}) sama untuk seluruh akun baru. Sampaikan langsung
          kepada pemilik akun dan minta mereka menggantinya setelah masuk.
        </p>
      </aside>
    </div>
  );
}
