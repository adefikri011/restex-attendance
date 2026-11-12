"use client";

import { useState, type FormEvent } from "react";
import { Send, ShieldAlert, X } from "lucide-react";
import { generateMemberEmail, getPeriodEmailCode } from "@/components/members/member-data";
import { initialAccountPassword } from "@/lib/account-credentials";
import {
  administratorRoles,
  type AdministratorAccount,
  type AdministratorRole,
} from "./administrator-account-data";
import styles from "./administrator-accounts.module.css";
import { notifications } from "@/lib/notifications";

type CreatedAccount = {
  account: AdministratorAccount;
  initialPassword: string;
};

type InviteAdministratorFormProps = {
  availableDivisions: string[];
  availablePjDivisions: string[];
  periodName: string | null;
  initialRole?: AdministratorRole;
  initialDivision?: string;
  onCancel: () => void;
  onCreated: (result: CreatedAccount) => void;
};

function isCreatedAccount(value: unknown): value is CreatedAccount {
  if (typeof value !== "object" || value === null || !("account" in value) || !("initialPassword" in value)) {
    return false;
  }
  const { account, initialPassword } = value;
  return (
    typeof account === "object" &&
    account !== null &&
    "id" in account &&
    typeof account.id === "string" &&
    "name" in account &&
    typeof account.name === "string" &&
    "email" in account &&
    typeof account.email === "string" &&
    "role" in account &&
    (account.role === "Super Admin" ||
      account.role === "Admin" ||
      account.role === "Ketua Divisi" ||
      account.role === "PJ Divisi") &&
    "status" in account &&
    account.status === "Aktif" &&
    typeof initialPassword === "string"
  );
}

function previewEmail(name: string, role: AdministratorRole, division: string, periodName: string | null) {
  if (!name.trim() || !periodName) return "";
  if (role === "Ketua Divisi" || role === "PJ Divisi") {
    return generateMemberEmail(name, division, periodName);
  }
  const nameSlug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const roleSlug = role === "Super Admin" ? "superadmin" : "admin";
  return nameSlug ? `${nameSlug}_${roleSlug}_${getPeriodEmailCode(periodName)}@restex.id` : "";
}

export function InviteAdministratorForm({
  availableDivisions,
  availablePjDivisions,
  periodName,
  initialRole = "Admin",
  initialDivision = "",
  onCancel,
  onCreated,
}: InviteAdministratorFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdministratorRole>(initialRole);
  const [division, setDivision] = useState<string>(initialDivision || availableDivisions[0] || "");
  const [confirmedSuperAdmin, setConfirmedSuperAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDivisionRole = role === "Ketua Divisi" || role === "PJ Divisi";
  const isSuperAdminRole = role === "Super Admin";
  const roleDivisions = role === "PJ Divisi" ? availablePjDivisions : availableDivisions;
  const selectedDivision = roleDivisions.includes(division) ? division : (roleDivisions[0] ?? "");
  const emailPreview = previewEmail(name, role, selectedDivision, periodName);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/administrator-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role:
            role === "Super Admin"
              ? "super-admin"
              : role === "Admin"
                ? "admin"
                : role === "Ketua Divisi"
                  ? "ketua-divisi"
                  : "pj-divisi",
          division: isDivisionRole ? selectedDivision : null,
          confirmSuperAdmin: isSuperAdminRole && confirmedSuperAdmin,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        notifications.error(
          "Akun pengurus gagal dibuat",
          typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
            ? result.error
            : "Akun pengurus gagal dibuat.",
        );
        return;
      }
      if (!isCreatedAccount(result)) {
        throw new Error("Respons pembuatan akun tidak valid.");
      }
      onCreated(result);
    } catch (caught) {
      notifications.error(
        "Akun pengurus gagal dibuat",
        caught instanceof Error
          ? caught.message
          : "Layanan pembuatan akun tidak dapat dihubungi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={styles.invitePanel} aria-labelledby="invite-admin-title">
      <div className={styles.inviteHeading}>
        <div>
          <span className={styles.sectionEyebrow}>AKSES PENGURUS</span>
          <h2 id="invite-admin-title">Buat akun pengurus</h2>
          <p>Akun langsung aktif setelah dibuat.</p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onCancel}
          aria-label="Tutup form akun pengurus"
        >
          <X size={18} />
        </button>
      </div>

      <form className={styles.inviteForm} onSubmit={handleSubmit}>
        <label>
          Nama lengkap
          <input
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama pengurus"
          />
        </label>
        <label>
          Jabatan
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as AdministratorRole);
              setConfirmedSuperAdmin(false);
            }}
          >
            {administratorRoles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        {isSuperAdminRole && (
          <div className={styles.superAdminWarning}>
            <p>
              <ShieldAlert size={15} aria-hidden="true" />
              Akun ini memiliki akses penuh ke seluruh data dan pengaturan organisasi.
            </p>
            <label>
              <input
                type="checkbox"
                checked={confirmedSuperAdmin}
                onChange={(event) =>
                  setConfirmedSuperAdmin(event.target.checked)
                }
              />
              Saya mengonfirmasi pembuatan akun Super Admin.
            </label>
          </div>
        )}
        {isDivisionRole && (
          <label>
            Divisi
            <select
              required
              value={selectedDivision}
              onChange={(event) => setDivision(event.target.value)}
              disabled={!roleDivisions.length}
            >
              {roleDivisions.length ? (
                roleDivisions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))
              ) : (
                <option value="">Semua divisi sudah memiliki {role === "PJ Divisi" ? "PJ" : "ketua"}</option>
              )}
            </select>
          </label>
        )}
        <label>
          Email akun
          <input readOnly value={emailPreview} placeholder="Email dibuat otomatis" />
        </label>
        <div className={styles.formFooter}>
          <p>
            Password awal: <strong>{initialAccountPassword}</strong>. Berikan email dan password
            ini secara langsung kepada pengurus.
          </p>
          <div>
            <button type="button" className={styles.secondaryButton} onClick={onCancel}>
              Batal
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={
                isSubmitting ||
                !periodName ||
                (isDivisionRole && !roleDivisions.length) ||
                (isSuperAdminRole && !confirmedSuperAdmin)
              }
            >
              <Send size={14} aria-hidden="true" />
              {isSubmitting ? "Membuat akun..." : "Buat akun"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
