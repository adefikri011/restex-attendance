"use client";

import { useState, type FormEvent } from "react";
import { Send, X } from "lucide-react";
import { generateMemberEmail, getPeriodEmailCode } from "@/components/members/member-data";
import { initialAccountPassword } from "@/lib/account-credentials";
import {
  administratorRoles,
  organizationDivisions,
  type AdministratorAccount,
  type AdministratorRole,
} from "./administrator-account-data";
import styles from "./administrator-accounts.module.css";

type CreatedAccount = {
  account: AdministratorAccount;
  initialPassword: string;
};

type InviteAdministratorFormProps = {
  availableDivisions: string[];
  periodName: string | null;
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
    (account.role === "Admin" || account.role === "Ketua Divisi") &&
    "status" in account &&
    account.status === "Aktif" &&
    typeof initialPassword === "string"
  );
}

function previewEmail(name: string, role: AdministratorRole, division: string, periodName: string | null) {
  if (!name.trim() || !periodName) return "";
  if (role === "Ketua Divisi") {
    return generateMemberEmail(name, division, periodName);
  }
  const nameSlug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return nameSlug ? `${nameSlug}_admin_${getPeriodEmailCode(periodName)}@restex.id` : "";
}

export function InviteAdministratorForm({
  availableDivisions,
  periodName,
  onCancel,
  onCreated,
}: InviteAdministratorFormProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdministratorRole>("Admin");
  const [division, setDivision] = useState<string>(availableDivisions[0] ?? organizationDivisions[0]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailPreview = previewEmail(name, role, division, periodName);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/administrator-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role: role === "Admin" ? "admin" : "ketua-divisi",
          division: role === "Ketua Divisi" ? division : null,
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        setError(
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
      setError(
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
              value={availableDivisions.includes(division) ? division : (availableDivisions[0] ?? "")}
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
                (role === "Ketua Divisi" && !availableDivisions.length)
              }
            >
              <Send size={14} aria-hidden="true" />
              {isSubmitting ? "Membuat akun..." : "Buat akun"}
            </button>
          </div>
        </div>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
