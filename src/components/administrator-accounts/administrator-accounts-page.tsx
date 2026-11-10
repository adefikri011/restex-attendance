"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
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
import { InviteAdministratorForm } from "./invite-administrator-form";
import {
  divisionMemberCounts,
  getAdministratorInitials,
  administratorRoles,
  initialAdministratorAccounts,
  organizationDivisions,
  type AdministratorAccount,
  type AdministratorAccountStatus,
  type AdministratorRole,
} from "./administrator-account-data";
import styles from "./administrator-accounts.module.css";

type RoleFilter = "Semua" | AdministratorRole;
type StatusFilter = "Semua" | AdministratorAccountStatus;

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
    description: "Mengelola administrasi anggota dan memantau seluruh divisi.",
    icon: KeyRound,
    className: styles.roleAdmin,
  },
  {
    role: "Ketua Divisi",
    title: "Ketua Divisi",
    description: "Mengelola anggota dan mencatat absensi hanya untuk divisinya.",
    icon: UsersRound,
    className: styles.roleDivisionLead,
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
  if (role === "Admin") return styles.roleBadgeAdmin;
  return styles.roleBadgeDivisionLead;
}

function getStatusClass(status: AdministratorAccountStatus) {
  if (status === "Aktif") return styles.statusActive;
  if (status === "Nonaktif") return styles.statusDisabled;
  return styles.statusInvited;
}

export function AdministratorAccountsPage() {
  const [accounts, setAccounts] = useState(initialAdministratorAccounts);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("Semua");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [notice, setNotice] = useState("");

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
  const invitedCount = accounts.filter(
    (account) => account.status === "Undangan terkirim",
  ).length;
  const divisionLeadCount = accounts.filter(
    (account) =>
      account.role === "Ketua Divisi" &&
      account.status === "Aktif",
  ).length;
  const divisionLeads = organizationDivisions.map((division) => ({
    division,
    memberCount: divisionMemberCounts[division],
    account: accounts.find(
      (account) =>
        account.role === "Ketua Divisi" &&
        account.division === division &&
        account.status !== "Nonaktif",
    ),
  }));

  function inviteAccount(account: AdministratorAccount) {
    setAccounts((currentAccounts) => [account, ...currentAccounts]);
    setIsInviteOpen(false);
    setRoleFilter("Semua");
    setStatusFilter("Semua");
    setSearch("");
    setNotice(
      `Undangan untuk ${account.name} disiapkan di pratinjau. Pengiriman email belum terhubung.`,
    );
  }

  function toggleAccountStatus(accountId: string) {
    const selectedAccount = accounts.find((account) => account.id === accountId);
    if (!selectedAccount || selectedAccount.role === "Super Admin") return;

    const nextStatus: AdministratorAccountStatus =
      selectedAccount.status === "Aktif" ? "Nonaktif" : "Aktif";
    if (
      nextStatus === "Aktif" &&
      selectedAccount.role === "Ketua Divisi" &&
      accounts.some(
        (account) =>
          account.id !== selectedAccount.id &&
          account.role === "Ketua Divisi" &&
          account.division === selectedAccount.division &&
          account.status !== "Nonaktif",
      )
    ) {
      setNotice(
        `${selectedAccount.division} sudah memiliki Ketua Divisi aktif atau undangan yang menunggu.`,
      );
      return;
    }

    setAccounts((currentAccounts) =>
      currentAccounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              status: nextStatus,
            }
          : account,
      ),
    );
    setNotice(
      selectedAccount.status === "Undangan terkirim"
        ? `Undangan ${selectedAccount.name} dibatalkan pada pratinjau.`
        : `${selectedAccount.name} diubah menjadi ${nextStatus}. Perubahan hanya tersimpan sementara di halaman ini.`,
    );
  }

  return (
    <div className={styles.accountsPage}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>PENGELOLAAN · AKSES ORGANISASI</span>
          <h1>Akun Pengurus</h1>
          <p>
            Atur akses pengurus dan pastikan setiap divisi memiliki Ketua Divisi.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => {
            setNotice("");
            setIsInviteOpen((isOpen) => !isOpen);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Undang pengurus
        </button>
      </header>

      {isInviteOpen && (
        <InviteAdministratorForm
          accounts={accounts}
          onCancel={() => setIsInviteOpen(false)}
          onInvite={inviteAccount}
        />
      )}

      <p className={styles.visuallyHidden} role="status" aria-live="polite">
        {notice}
      </p>

      <section className={styles.summaryGrid} aria-label="Ringkasan akun pengurus">
        <article className={styles.summaryCard}>
          <span className={styles.summaryIcon}>
            <UsersRound size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Total akun pengurus</span>
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
            <span>Undangan menunggu</span>
            <strong>{invitedCount}</strong>
          </div>
          <small>Belum diaktifkan</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconRose}`}>
            <Building2 size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Ketua Divisi aktif</span>
            <strong>{divisionLeadCount}<small> / {organizationDivisions.length}</small></strong>
          </div>
          <small>Penanggung jawab divisi</small>
        </article>
      </section>

      <section className={styles.divisionSection} aria-labelledby="division-coverage-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>STRUKTUR DIVISI</span>
            <h2 id="division-coverage-title">Penanggung jawab per divisi</h2>
            <p>Ketua Divisi hanya dapat mengelola anggota dan absensi divisinya.</p>
          </div>
          <span className={styles.coverageBadge}>
            <Check size={13} aria-hidden="true" />
            {divisionLeads.filter((item) => item.account).length} dari {organizationDivisions.length} terisi
          </span>
        </div>
        <div className={styles.divisionGrid}>
          {divisionLeads.map(({ division, memberCount, account }) => (
            <article className={styles.divisionCard} key={division}>
              <span className={styles.divisionIcon} aria-hidden="true">
                <Building2 size={16} />
              </span>
              <div className={styles.divisionInfo}>
                <h3>{division}</h3>
                <span>{memberCount} anggota aktif</span>
              </div>
              {account ? (
                <div className={styles.divisionLead}>
                  <span>{getAdministratorInitials(account.name)}</span>
                  <div>
                    <strong>{account.name}</strong>
                    <small>{account.status === "Aktif" ? "Ketua Divisi" : "Undangan terkirim"}</small>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.assignButton}
                  onClick={() => {
                    setRoleFilter("Ketua Divisi");
                    setStatusFilter("Semua");
                    setSearch(division);
                    setIsInviteOpen(true);
                  }}
                >
                  Undang ketua
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.accessSection} aria-labelledby="access-guide-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>PEMBAGIAN AKSES</span>
            <h2 id="access-guide-title">Siapa bisa melakukan apa?</h2>
            <p>Hak akses dibuat sesuai tanggung jawab agar data setiap divisi tetap terjaga.</p>
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
            <h2 id="account-list-title">Daftar akun pengurus</h2>
            <p>Nonaktifkan akses ketika pengurus tidak lagi bertugas.</p>
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
              placeholder="Cari nama, email, atau divisi..."
            />
          </label>
          <label className={styles.filterSelect}>
            <span>Jabatan</span>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              aria-label="Filter jabatan"
            >
              <option value="Semua">Semua jabatan</option>
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
              <option value="Undangan terkirim">Undangan terkirim</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
        </div>

        <div className={styles.accountList}>
          {filteredAccounts.length ? (
            filteredAccounts.map((account) => (
              <article className={styles.accountRow} key={account.id}>
                <span className={`${styles.accountAvatar} ${account.role === "Ketua Divisi" ? styles.avatarDivision : ""}`}>
                  {getAdministratorInitials(account.name)}
                </span>
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
                  <span>{account.status === "Undangan terkirim" ? "Undangan" : "Aktif terakhir"}</span>
                  <strong>{account.lastActiveAt ?? account.inviteSentAt}</strong>
                </div>
                {account.role === "Super Admin" ? (
                  <span className={styles.protectedAccount}>
                    <Shield size={15} aria-hidden="true" />
                    Terlindungi
                  </span>
                ) : (
                  <button
                    type="button"
                    className={account.status === "Aktif" ? styles.deactivateButton : account.status === "Undangan terkirim" ? styles.cancelInviteButton : styles.activateButton}
                    onClick={() => toggleAccountStatus(account.id)}
                    aria-label={`${account.status === "Aktif" ? "Nonaktifkan" : account.status === "Undangan terkirim" ? "Batalkan undangan" : "Aktifkan kembali"} ${account.name}`}
                  >
                    {account.status === "Aktif" ? "Nonaktifkan" : account.status === "Undangan terkirim" ? "Batalkan undangan" : "Aktifkan"}
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
          Undangan dan perubahan status ini hanya simulasi tampilan. Pembatasan akses
          Ketua Divisi dan pengiriman email perlu diterapkan di backend sebelum digunakan.
        </p>
      </aside>
    </div>
  );
}
