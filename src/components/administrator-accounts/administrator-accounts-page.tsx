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
  UserRoundCheck,
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

type RoleFilter = "Semua" | AdministratorRole;
type StatusFilter = "Semua" | AdministratorAccountStatus;

type AdministratorAccountsPageProps = {
  accounts: AdministratorAccount[];
  divisions: string[];
  divisionMemberCounts: Record<string, number>;
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
    description: "Mengelola administrasi anggota dan memantau seluruh divisi.",
    icon: KeyRound,
    className: styles.roleAdmin,
  },
  {
    role: "Ketua Divisi",
    title: "Ketua Divisi",
    description: "Memiliki penugasan pada satu divisi yang ditetapkan.",
    icon: UsersRound,
    className: styles.roleDivisionLead,
  },
  {
    role: "PJ Divisi",
    title: "PJ Divisi",
    description: "Dapat membuka sesi sebagai pengganti Ketua Divisi dan mencatat absensi pada divisinya.",
    icon: UserRoundCheck,
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
  return styles.statusDisabled;
}

export function AdministratorAccountsPage({
  accounts: initialAccounts,
  divisions,
  divisionMemberCounts,
  periodName,
}: AdministratorAccountsPageProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("Semua");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<AdministratorRole>("Admin");
  const [inviteDivision, setInviteDivision] = useState("");
  const [notice, setNotice] = useState("");
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
  const divisionLeads = divisions.map((division) => ({
    division,
    memberCount: divisionMemberCounts[division] ?? 0,
    lead: accounts.find(
      (account) =>
        account.role === "Ketua Divisi" &&
        account.division === division &&
        account.status === "Aktif",
    ),
    pj: accounts.find(
      (account) =>
        account.role === "PJ Divisi" &&
        account.division === division &&
        account.status === "Aktif",
    ),
  }));
  const availableDivisions = divisions.filter(
    (division) => !divisionLeads.some((item) => item.division === division && item.lead),
  );
  const availablePjDivisions = divisions.filter(
    (division) => !divisionLeads.some((item) => item.division === division && item.pj),
  );

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
    setNotice(`Akun ${result.account.name} berhasil dibuat.`);
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
        setNotice(
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
      setNotice(`${selectedAccount.name} sekarang ${nextStatus.toLocaleLowerCase("id")}.`);
    } catch {
      setNotice("Layanan akun pengurus tidak dapat dihubungi.");
    }
  }

  return (
    <div className={styles.accountsPage}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>PENGELOLAAN · AKSES ORGANISASI</span>
          <h1>Akun Pengurus</h1>
          <p>
            Kelola akses Super Admin, Admin, Ketua Divisi, dan PJ dengan hak yang sesuai.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => {
            setNotice("");
            setCreatedCredentials(null);
            setInviteRole("Admin");
            setInviteDivision("");
            setIsInviteOpen((isOpen) => !isOpen);
          }}
        >
          <Plus size={16} aria-hidden="true" />
          Buat akun pengurus
        </button>
      </header>

      {isInviteOpen && (
        <InviteAdministratorForm
          availableDivisions={availableDivisions}
          availablePjDivisions={availablePjDivisions}
          periodName={periodName}
          initialRole={inviteRole}
          initialDivision={inviteDivision}
          onCancel={() => setIsInviteOpen(false)}
          onCreated={addCreatedAccount}
        />
      )}

      {createdCredentials ? (
        <aside className={styles.previewNote} role="status">
          <ShieldCheck size={15} aria-hidden="true" />
          <p>
            Akun berhasil dibuat. Email: <strong>{createdCredentials.email}</strong>
            {" · "}Password awal: <code>{createdCredentials.password}</code>
            {" "}— berikan kredensial ini langsung kepada pengurus.
          </p>
        </aside>
      ) : (
        <p className={styles.visuallyHidden} role="status" aria-live="polite">
          {notice}
        </p>
      )}

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
            <span>Akun nonaktif</span>
            <strong>{inactiveCount}</strong>
          </div>
          <small>Akses sistem dimatikan</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconRose}`}>
            <Building2 size={17} aria-hidden="true" />
          </span>
          <div>
            <span>PJ Divisi aktif</span>
            <strong>{accounts.filter((account) => account.role === "PJ Divisi" && account.status === "Aktif").length}<small> / {divisions.length}</small></strong>
          </div>
          <small>Akun cadangan absensi</small>
        </article>
      </section>

      <section className={styles.divisionSection} aria-labelledby="division-coverage-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionEyebrow}>STRUKTUR DIVISI</span>
            <h2 id="division-coverage-title">Penanggung jawab per divisi</h2>
            <p>Setiap divisi dapat memiliki satu Ketua dan satu PJ aktif.</p>
          </div>
          <span className={styles.coverageBadge}>
            <Check size={13} aria-hidden="true" />
            {divisionLeads.filter((item) => item.lead && item.pj).length} dari {divisions.length} lengkap
          </span>
        </div>
        <div className={styles.divisionGrid}>
          {divisionLeads.map(({ division, memberCount, lead, pj }) => (
            <article className={styles.divisionCard} key={division}>
              <span className={styles.divisionIcon} aria-hidden="true">
                <Building2 size={16} />
              </span>
              <div className={styles.divisionInfo}>
                <h3>{division}</h3>
                <span>{memberCount} anggota aktif</span>
              </div>
              {lead ? (
                <div className={styles.divisionLead}>
                  <UserAvatar
                    className={styles.divisionLeadAvatar}
                    initials={getAdministratorInitials(lead.name)}
                    imageUrl={lead.photoUrl}
                  />
                  <div>
                    <strong>{lead.name}</strong>
                    <small>Ketua Divisi</small>
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
                    setInviteRole("Ketua Divisi");
                    setInviteDivision(division);
                    setIsInviteOpen(true);
                  }}
                >
                  Undang ketua
                </button>
              )}
              {pj ? (
                <div className={styles.divisionLead}>
                  <UserAvatar
                    className={styles.divisionLeadAvatar}
                    initials={getAdministratorInitials(pj.name)}
                    imageUrl={pj.photoUrl}
                  />
                  <div>
                    <strong>{pj.name}</strong>
                    <small>PJ Divisi</small>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.assignButton}
                  onClick={() => {
                    setRoleFilter("PJ Divisi");
                    setStatusFilter("Semua");
                    setSearch(division);
                    setInviteRole("PJ Divisi");
                    setInviteDivision(division);
                    setIsInviteOpen(true);
                  }}
                >
                  Undang PJ
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
                  className={`${styles.accountAvatar} ${account.role === "Ketua Divisi" || account.role === "PJ Divisi" ? styles.avatarDivision : ""}`}
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
          Password awal ({initialAccountPassword}) sama untuk seluruh akun baru. Karena semua akun berbagi
          password sementara ini, sampaikan secara pribadi kepada masing-masing pemilik akun.
        </p>
      </aside>
    </div>
  );
}
