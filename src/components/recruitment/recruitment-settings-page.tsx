"use client";

import { useState, type FormEvent } from "react";
import { Check, Megaphone, Save } from "lucide-react";
import type { RecruitmentSettings } from "@/lib/recruitment";
import styles from "./recruitment-settings-page.module.css";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSettings(value: unknown): value is RecruitmentSettings {
  return (
    isRecord(value) &&
    typeof value.open === "boolean" &&
    (typeof value.opensAt === "string" || value.opensAt === undefined) &&
    (typeof value.closesAt === "string" || value.closesAt === undefined) &&
    typeof value.registerUrl === "string" &&
    typeof value.notifyUrl === "string"
  );
}

function getRegistrationUrl(value: string) {
  return value.startsWith("/") && !value.startsWith("//")
    ? "/pendaftaran"
    : value;
}

export function RecruitmentSettingsPage({
  initialSettings,
}: {
  initialSettings: RecruitmentSettings;
}) {
  const [settings, setSettings] = useState({
    ...initialSettings,
    registerUrl: getRegistrationUrl(initialSettings.registerUrl),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/recruitment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Pengaturan pendaftaran gagal disimpan.",
        );
      }
      if (!isRecord(result) || !isSettings(result.settings)) {
        throw new Error("Respons server tidak valid. Muat ulang halaman.");
      }

      setSettings(result.settings);
      setSuccess("Pengaturan pendaftaran berhasil disimpan.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Pengaturan pendaftaran gagal disimpan. Coba lagi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <span className={styles.eyebrow}>PENGELOLAAN ORGANISASI</span>
        <h1>Pendaftaran anggota</h1>
        <p>
          Atur status oprec dan tautan yang ditampilkan di website RESTEX.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} aria-busy={isSaving}>
        <section className={styles.section} aria-labelledby="registration-status-title">
          <div className={styles.sectionHeading}>
            <span className={styles.icon} aria-hidden="true">
              <Megaphone size={19} />
            </span>
            <div>
              <h2 id="registration-status-title">Status pendaftaran</h2>
              <p>
                Atur tanggal jadwal dan buka pendaftaran secara manual saat
                pendaftaran siap diterima.
              </p>
            </div>
          </div>

          <label className={styles.toggleRow}>
            <span>
              <strong>Buka pendaftaran sekarang</strong>
              <small>
                Saat aktif, pengunjung dapat melihat oprec sebagai dibuka.
                Tanggal penutupan tetap berlaku.
              </small>
            </span>
            <input
              type="checkbox"
              checked={settings.open}
              onChange={(event) =>
                setSettings((current) => ({ ...current, open: event.target.checked }))
              }
              aria-label="Buka pendaftaran sekarang"
            />
          </label>

          <div className={styles.dateFields}>
            <label>
              Tanggal pembukaan
              <input
                type="date"
                value={settings.opensAt ?? ""}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    opensAt: event.target.value || undefined,
                  }))
                }
              />
              <small>Opsional. Tanggal memakai zona waktu WIB.</small>
            </label>
            <label>
              Tanggal penutupan
              <input
                type="date"
                value={settings.closesAt ?? ""}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    closesAt: event.target.value || undefined,
                  }))
                }
              />
              <small>Pendaftaran otomatis ditutup setelah tanggal ini.</small>
            </label>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="registration-links-title">
          <div className={styles.sectionHeading}>
            <span className={styles.icon} aria-hidden="true">
              <Check size={19} />
            </span>
            <div>
              <h2 id="registration-links-title">Tautan pendaftaran</h2>
              <p>
                Tautan internal memakai formulir RESTEX di /pendaftaran. Kamu juga
                bisa memakai tautan HTTPS dari layanan pendaftaran lain.
              </p>
            </div>
          </div>

          <div className={styles.linkFields}>
            <label>
              URL pendaftaran
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="/pendaftaran atau https://..."
                value={settings.registerUrl}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    registerUrl: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              URL pemberitahuan
              <input
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="https://..."
                value={settings.notifyUrl}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    notifyUrl: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        </section>

        {(error || success) && (
          <p
            className={error ? styles.error : styles.success}
            role={error ? "alert" : "status"}
          >
            {error || success}
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" className={styles.saveButton} disabled={isSaving}>
            <Save size={16} aria-hidden="true" />
            {isSaving ? "Menyimpan..." : "Simpan pengaturan"}
          </button>
        </div>
      </form>
    </main>
  );
}
