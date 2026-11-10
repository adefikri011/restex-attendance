"use client";

import { useState, type FormEvent } from "react";
import { Building2, Check, Pencil, Plus, ToggleLeft, ToggleRight, Trash2, X } from "lucide-react";
import type { DivisionSummary } from "@/lib/division-service";
import styles from "./members.module.css";

type DivisionManagerProps = {
  initialDivisions: DivisionSummary[];
  onDivisionsChange: (divisions: DivisionSummary[]) => void;
};

type SavedDivision = Pick<DivisionSummary, "id" | "name" | "isActive" | "sortOrder">;

function isSavedDivisionResult(
  value: unknown,
): value is { division: SavedDivision } {
  if (typeof value !== "object" || value === null || !("division" in value)) {
    return false;
  }
  const { division } = value;
  return (
    typeof division === "object" &&
    division !== null &&
    "id" in division &&
    typeof division.id === "string" &&
    "name" in division &&
    typeof division.name === "string" &&
    "isActive" in division &&
    typeof division.isActive === "boolean" &&
    "sortOrder" in division &&
    typeof division.sortOrder === "number"
  );
}

function getErrorMessage(value: unknown) {
  return typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
    ? value.error
    : "Perubahan divisi gagal disimpan.";
}

export function DivisionManager({
  initialDivisions,
  onDivisionsChange,
}: DivisionManagerProps) {
  const [divisions, setDivisions] = useState(initialDivisions);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function applyDivisions(nextDivisions: DivisionSummary[]) {
    setDivisions(nextDivisions);
    onDivisionsChange(nextDivisions);
  }

  async function addDivision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/divisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(result));
      if (!isSavedDivisionResult(result)) {
        throw new Error("Respons server divisi tidak valid.");
      }

      applyDivisions([
        ...divisions,
        {
          id: result.division.id,
          name: result.division.name,
          isActive: result.division.isActive,
          sortOrder: result.division.sortOrder,
          membershipCount: 0,
          managerCount: 0,
        },
      ].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.sortOrder - b.sortOrder));
      setNewName("");
      setMessage("Divisi berhasil ditambahkan.");
      setIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Divisi gagal ditambahkan.");
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  }

  async function updateDivision(division: DivisionSummary, changes: { name?: string; isActive?: boolean }) {
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/divisions/${encodeURIComponent(division.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(changes),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(result));
      if (!isSavedDivisionResult(result)) {
        throw new Error("Respons server divisi tidak valid.");
      }

      applyDivisions(
        divisions
          .map((item) =>
            item.id === division.id
              ? {
                  ...item,
                  name: result.division.name,
                  isActive: result.division.isActive,
                  sortOrder: result.division.sortOrder,
                }
              : item,
          )
          .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.sortOrder - b.sortOrder),
      );
      setEditingId(null);
      setMessage("Divisi berhasil diperbarui.");
      setIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Divisi gagal diperbarui.");
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeDivision(division: DivisionSummary) {
    if (!window.confirm(`Hapus divisi "${division.name}"?`)) return;
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/divisions/${encodeURIComponent(division.id)}`, {
        method: "DELETE",
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(result));
      applyDivisions(divisions.filter(({ id }) => id !== division.id));
      setMessage("Divisi berhasil dihapus.");
      setIsError(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Divisi gagal dihapus.");
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.divisionManager} aria-labelledby="division-manager-title">
      <header className={styles.divisionManagerHeader}>
        <div>
          <span className={styles.divisionManagerIcon}><Building2 size={16} aria-hidden="true" /></span>
          <div>
            <h2 id="division-manager-title">Kelola divisi</h2>
            <p>Perubahan di sini akan digunakan pada data anggota dan akun pengurus divisi.</p>
          </div>
        </div>
        <form className={styles.divisionAddForm} onSubmit={addDivision}>
          <input
            aria-label="Nama divisi baru"
            maxLength={100}
            minLength={2}
            required
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Nama divisi baru"
          />
          <button type="submit" disabled={isSaving}>
            <Plus size={14} aria-hidden="true" />
            Tambah
          </button>
        </form>
      </header>

      <div className={styles.divisionList}>
        {divisions.map((division) => (
          <div className={styles.divisionRow} key={division.id}>
            {editingId === division.id ? (
              <form
                className={styles.divisionEditForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  void updateDivision(division, { name: editingName });
                }}
              >
                <input
                  aria-label={`Nama divisi ${division.name}`}
                  autoFocus
                  maxLength={100}
                  minLength={2}
                  required
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                />
                <button type="submit" aria-label="Simpan nama divisi" disabled={isSaving}>
                  <Check size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Batal edit divisi"
                  onClick={() => setEditingId(null)}
                  disabled={isSaving}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </form>
            ) : (
              <>
                <div className={styles.divisionRowName}>
                  <strong>{division.name}</strong>
                  <span className={division.isActive ? "" : styles.divisionInactiveBadge}>
                    {division.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <small>
                  {division.membershipCount} data anggota · {division.managerCount} akun pengurus
                </small>
                <div className={styles.divisionRowActions}>
                  <button
                    type="button"
                    aria-label={`Ubah nama ${division.name}`}
                    title="Ubah nama"
                    onClick={() => {
                      setEditingId(division.id);
                      setEditingName(division.name);
                    }}
                    disabled={isSaving}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={division.isActive ? `Nonaktifkan ${division.name}` : `Aktifkan ${division.name}`}
                    title={division.isActive ? "Nonaktifkan" : "Aktifkan"}
                    onClick={() => void updateDivision(division, { isActive: !division.isActive })}
                    disabled={isSaving}
                  >
                    {division.isActive
                      ? <ToggleRight size={17} aria-hidden="true" />
                      : <ToggleLeft size={17} aria-hidden="true" />}
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus ${division.name}`}
                    title={division.membershipCount || division.managerCount ? "Divisi terpakai; nonaktifkan untuk menyimpan riwayat" : "Hapus divisi"}
                    onClick={() => void removeDivision(division)}
                    disabled={isSaving || Boolean(division.membershipCount || division.managerCount)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {message && (
        <p className={isError ? styles.divisionError : styles.divisionSuccess} role={isError ? "alert" : "status"}>
          {message}
        </p>
      )}
    </section>
  );
}
