import { useState, type FormEvent } from "react";
import { Send, X } from "lucide-react";
import {
  administratorRoles,
  organizationDivisions,
  type AdministratorAccount,
  type AdministratorRole,
} from "./administrator-account-data";
import styles from "./administrator-accounts.module.css";

type InviteAdministratorFormProps = {
  accounts: AdministratorAccount[];
  onCancel: () => void;
  onInvite: (account: AdministratorAccount) => void;
};

export function InviteAdministratorForm({
  accounts,
  onCancel,
  onInvite,
}: InviteAdministratorFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdministratorRole>("Admin");
  const [division, setDivision] = useState<string>(organizationDivisions[0]);
  const [error, setError] = useState("");

  const availableDivisions = organizationDivisions.filter(
    (item) =>
      !accounts.some(
        (account) =>
          account.role === "Ketua Divisi" &&
          account.division === item &&
          account.status !== "Nonaktif",
      ),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLocaleLowerCase("id");
    if (
      accounts.some(
        (account) => account.email.toLocaleLowerCase("id") === normalizedEmail,
      )
    ) {
      setError("Email ini sudah digunakan oleh akun atau undangan lain.");
      return;
    }

    if (role === "Ketua Divisi" && !availableDivisions.includes(division as (typeof organizationDivisions)[number])) {
      setError("Divisi tersebut sudah memiliki Ketua Divisi aktif atau menunggu undangan.");
      return;
    }

    onInvite({
      id: `USR-${String(accounts.length + 1).padStart(3, "0")}`,
      name: name.trim(),
      email: normalizedEmail,
      role,
      division: role === "Ketua Divisi" ? division : null,
      status: "Undangan terkirim",
      lastActiveAt: null,
      inviteSentAt: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(new Date()),
    });
  }

  return (
    <section className={styles.invitePanel} aria-labelledby="invite-admin-title">
      <div className={styles.inviteHeading}>
        <div>
          <span className={styles.sectionEyebrow}>AKSES PENGURUS</span>
          <h2 id="invite-admin-title">Undang akun pengurus</h2>
          <p>Pengurus menerima undangan untuk mengaktifkan aksesnya.</p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onCancel}
          aria-label="Tutup form undangan"
        >
          <X size={18} />
        </button>
      </div>

      <form className={styles.inviteForm} onSubmit={handleSubmit}>
        <label>
          Nama lengkap
          <input
            required
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama pengurus"
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@restex.id"
          />
        </label>
        <label>
          Jabatan
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AdministratorRole)}
          >
            {administratorRoles
              .filter((item) => item !== "Super Admin")
              .map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
          </select>
        </label>
        {role === "Ketua Divisi" && (
          <label>
            Divisi
            <select
              required
              value={availableDivisions.includes(division as (typeof organizationDivisions)[number]) ? division : (availableDivisions[0] ?? "")}
              onChange={(event) => setDivision(event.target.value)}
              disabled={!availableDivisions.length}
            >
              {availableDivisions.length ? (
                availableDivisions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))
              ) : (
                <option value="">Semua divisi sudah memiliki ketua</option>
              )}
            </select>
          </label>
        )}
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <div className={styles.formFooter}>
          <p>
            {role === "Ketua Divisi"
              ? "Ketua Divisi hanya mengelola anggota dan absensi pada divisi yang ditetapkan."
              : "Admin mengelola administrasi organisasi dan memantau seluruh divisi."}
          </p>
          <div>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>
              Batal
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={role === "Ketua Divisi" && !availableDivisions.length}
            >
              <Send size={14} aria-hidden="true" />
              Kirim undangan
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
