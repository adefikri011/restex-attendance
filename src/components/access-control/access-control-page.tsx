"use client";

import { useState, type FormEvent } from "react";
import {
  accessManagedRoles,
  officerPositions,
  type OfficerPositionKey,
  type PageAccessKey,
} from "@/lib/page-access-config";
import { notifications } from "@/lib/notifications";
import styles from "./access-control-page.module.css";

type Settings = {
  pages: {
    key: PageAccessKey;
    label: string;
    href: string;
    sensitive: boolean;
  }[];
  roles: {
    id: string;
    label: string;
    pages: { key: PageAccessKey; enabled: boolean }[];
  }[];
  positions: {
    key: OfficerPositionKey;
    label: string;
    requiresDivision: boolean;
    pages: { key: PageAccessKey; enabled: boolean }[];
  }[];
};

type AssignmentData = {
  periods: { id: string; name: string; isActive: boolean }[];
  selectedPeriod: { id: string; name: string; isActive: boolean } | null;
  members: { id: string; fullName: string; nim: string }[];
  assignments: {
    id: string;
    position: string;
    division: string | null;
    member: { id: string; fullName: string; nim: string; userId: string | null };
  }[];
  divisions: string[];
};

type AccessControlPageProps = {
  initialSettings: Settings;
  initialAssignmentData: AssignmentData;
};

type Tab = "roles" | "positions" | "assignments";

async function getError(response: Response, fallback: string) {
  const result: unknown = await response.json();
  return typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof result.error === "string"
    ? result.error
    : fallback;
}

export function AccessControlPage({
  initialSettings,
  initialAssignmentData,
}: AccessControlPageProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [assignmentData, setAssignmentData] = useState(initialAssignmentData);
  const [tab, setTab] = useState<Tab>("roles");
  const [selectedRole, setSelectedRole] = useState("admin");
  const [selectedPosition, setSelectedPosition] =
    useState<OfficerPositionKey>("humas");
  const [memberId, setMemberId] = useState("");
  const [position, setPosition] = useState<OfficerPositionKey>("humas");
  const [division, setDivision] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const role = settings.roles.find(({ id }) => id === selectedRole);
  const roleDefaults = savedSettings.roles.find(({ id }) => id === selectedRole);
  const roleChanges =
    role && roleDefaults
      ? role.pages.flatMap(({ key, enabled }) => {
          const previous = roleDefaults.pages.find((page) => page.key === key);
          return previous?.enabled === enabled
            ? []
            : [{ scope: "role", target: role.id, page: key, enabled }];
        })
      : [];
  const selectedPositionSettings = settings.positions.find(
    ({ key }) => key === selectedPosition,
  );
  const savedPositionSettings = savedSettings.positions.find(
    ({ key }) => key === selectedPosition,
  );
  const positionChanges =
    selectedPositionSettings && savedPositionSettings
      ? selectedPositionSettings.pages.flatMap(({ key, enabled }) => {
          const previous = savedPositionSettings.pages.find(
            (page) => page.key === key,
          );
          return previous?.enabled === enabled
            ? []
            : [{ scope: "position", target: selectedPosition, page: key, enabled }];
        })
      : [];
  const currentChanges = tab === "roles" ? roleChanges : positionChanges;

  function setPageAccess(
    scope: "role" | "position",
    target: string,
    page: PageAccessKey,
    enabled: boolean,
  ) {
    if (scope === "role") {
      setSettings((current) => ({
        ...current,
        roles: current.roles.map((item) =>
          item.id === target
            ? {
                ...item,
                pages: item.pages.map((itemPage) =>
                  itemPage.key === page ? { ...itemPage, enabled } : itemPage,
                ),
              }
            : item,
        ),
      }));
      return;
    }

    setSettings((current) => ({
      ...current,
      positions: current.positions.map((item) =>
        item.key === target
          ? {
              ...item,
              pages: item.pages.map((itemPage) =>
                itemPage.key === page ? { ...itemPage, enabled } : itemPage,
              ),
            }
          : item,
      ),
    }));
  }

  async function saveAccess() {
    if (currentChanges.length === 0) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/access-control", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: currentChanges }),
      });
      if (!response.ok) throw new Error(await getError(response, "Akses gagal disimpan."));
      const result: unknown = await response.json();
      if (
        typeof result !== "object" ||
        result === null ||
        !("roles" in result) ||
        !("positions" in result) ||
        !("pages" in result)
      ) {
        throw new Error("Respons pengaturan akses tidak valid.");
      }
      const next = result as Settings;
      setSettings(next);
      setSavedSettings(next);
      notifications.success("Akses diperbarui", "Perubahan hak halaman sudah tersimpan.");
    } catch (error) {
      notifications.error(
        "Akses gagal disimpan",
        error instanceof Error ? error.message : "Silakan coba kembali.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function loadAssignments(periodId: string) {
    try {
      const response = await fetch(
        `/api/officer-assignments?periodId=${encodeURIComponent(periodId)}`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error(await getError(response, "Data penugasan gagal dimuat."));
      const result: unknown = await response.json();
      if (
        typeof result !== "object" ||
        result === null ||
        !("assignments" in result) ||
        !("members" in result) ||
        !("periods" in result) ||
        !("divisions" in result) ||
        !("selectedPeriod" in result)
      ) {
        throw new Error("Respons penugasan tidak valid.");
      }
      setAssignmentData(result as AssignmentData);
    } catch (error) {
      notifications.error(
        "Penugasan gagal dimuat",
        error instanceof Error ? error.message : "Silakan coba kembali.",
      );
    }
  }

  async function addAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assignmentData.selectedPeriod || !memberId) return;
    setIsSaving(true);
    try {
      const requiresDivision = officerPositions.find(
        (item) => item.key === position,
      )?.requiresDivision;
      const response = await fetch("/api/officer-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          periodId: assignmentData.selectedPeriod.id,
          position,
          division: requiresDivision ? division : null,
        }),
      });
      if (!response.ok) throw new Error(await getError(response, "Jabatan gagal ditambahkan."));
      setMemberId("");
      await loadAssignments(assignmentData.selectedPeriod.id);
      notifications.success("Jabatan ditambahkan", "Penugasan periode sudah tersimpan.");
    } catch (error) {
      notifications.error(
        "Jabatan gagal ditambahkan",
        error instanceof Error ? error.message : "Silakan coba kembali.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAssignment(id: string) {
    if (!assignmentData.selectedPeriod) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/officer-assignments?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await getError(response, "Jabatan gagal dihapus."));
      await loadAssignments(assignmentData.selectedPeriod.id);
      notifications.success("Jabatan dihapus", "Penugasan sudah dihapus.");
    } catch (error) {
      notifications.error(
        "Jabatan gagal dihapus",
        error instanceof Error ? error.message : "Silakan coba kembali.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const requiresDivision = officerPositions.find(
    (item) => item.key === position,
  )?.requiresDivision;

  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>PENGELOLAAN SISTEM</p>
          <h1>Akses halaman</h1>
          <p>
            Atur halaman yang dapat dibuka setiap role atau jabatan pada periode aktif.
            Super Admin selalu memiliki akses penuh.
          </p>
        </div>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="Pengaturan akses">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "roles"}
          onClick={() => setTab("roles")}
        >
          Akses role
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "positions"}
          onClick={() => setTab("positions")}
        >
          Akses jabatan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "assignments"}
          onClick={() => setTab("assignments")}
        >
          Susunan per periode
        </button>
      </div>

      {tab === "roles" && (
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h2>Hak akses berdasarkan role</h2>
              <p>Jika sebuah role diberi akses, semua akun dengan role itu dapat membuka halaman.</p>
            </div>
            <label className={styles.selectLabel}>
              Pilih role
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
              >
                {accessManagedRoles.map(({ id, label }) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          {role?.id === "super-admin" ? (
            <p className={styles.notice}>
              Super Admin selalu memiliki akses ke semua halaman. Hak ini tidak dapat
              dimatikan dari panel.
            </p>
          ) : (
            <>
              <div className={styles.permissionList}>
                {settings.pages.map((page) => {
                  const enabled = role?.pages.find((item) => item.key === page.key)?.enabled ?? false;
                  return (
                    <label className={styles.permissionRow} key={page.key}>
                      <span>
                        <strong>{page.label}</strong>
                        <small>{page.href}{page.sensitive ? " · Akses data dan tindakan halaman" : ""}</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(event) =>
                          setPageAccess("role", selectedRole, page.key, event.target.checked)
                        }
                        aria-label={`${enabled ? "Matikan" : "Aktifkan"} ${page.label} untuk ${role?.label}`}
                      />
                    </label>
                  );
                })}
              </div>
              <div className={styles.actions}>
                <span>{roleChanges.length ? `${roleChanges.length} perubahan belum disimpan` : "Semua perubahan tersimpan"}</span>
                <button type="button" disabled={!roleChanges.length || isSaving} onClick={saveAccess}>
                  {isSaving ? "Menyimpan..." : "Simpan akses"}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "positions" && (
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h2>Hak akses berdasarkan jabatan</h2>
              <p>
                Izin jabatan hanya berlaku untuk pemegang jabatan pada periode aktif.
                Izin role dan jabatan digabung.
              </p>
            </div>
            <label className={styles.selectLabel}>
              Pilih jabatan
              <select
                value={selectedPosition}
                onChange={(event) => setSelectedPosition(event.target.value as OfficerPositionKey)}
              >
                {officerPositions.map(({ key, label }) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.permissionList}>
            {settings.pages.map((page) => {
              const enabled =
                selectedPositionSettings?.pages.find((item) => item.key === page.key)?.enabled ?? false;
              return (
                <label className={styles.permissionRow} key={page.key}>
                  <span>
                    <strong>{page.label}</strong>
                    <small>{page.href}{page.sensitive ? " · Akses data dan tindakan halaman" : ""}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) =>
                      setPageAccess("position", selectedPosition, page.key, event.target.checked)
                    }
                    aria-label={`${enabled ? "Matikan" : "Aktifkan"} ${page.label} untuk ${selectedPositionSettings?.label}`}
                  />
                </label>
              );
            })}
          </div>
          <div className={styles.actions}>
            <span>{positionChanges.length ? `${positionChanges.length} perubahan belum disimpan` : "Semua perubahan tersimpan"}</span>
            <button type="button" disabled={!positionChanges.length || isSaving} onClick={saveAccess}>
              {isSaving ? "Menyimpan..." : "Simpan akses"}
            </button>
          </div>
        </section>
      )}

      {tab === "assignments" && (
        <section className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h2>Susunan pengurus</h2>
              <p>Jabatan terikat pada periode. Akun pengurus yang terhubung ke anggota akan menerima akses jabatan.</p>
            </div>
            <label className={styles.selectLabel}>
              Periode
              <select
                value={assignmentData.selectedPeriod?.id ?? ""}
                onChange={(event) => void loadAssignments(event.target.value)}
              >
                {assignmentData.periods.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}{item.isActive ? " · Aktif" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {!assignmentData.selectedPeriod ? (
            <p className={styles.notice}>Buat periode terlebih dahulu sebelum menetapkan pengurus.</p>
          ) : (
            <>
              <form className={styles.assignmentForm} onSubmit={addAssignment}>
                <label className={styles.selectLabel}>
                  Anggota
                  <select value={memberId} required onChange={(event) => setMemberId(event.target.value)}>
                    <option value="">Pilih anggota</option>
                    {assignmentData.members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName} · {member.nim}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.selectLabel}>
                  Jabatan
                  <select
                    value={position}
                    onChange={(event) => setPosition(event.target.value as OfficerPositionKey)}
                  >
                    {officerPositions.map((item) => (
                      <option key={item.key} value={item.key}>{item.label}</option>
                    ))}
                  </select>
                </label>
                {requiresDivision && (
                  <label className={styles.selectLabel}>
                    Divisi
                    <select value={division} required onChange={(event) => setDivision(event.target.value)}>
                      <option value="">Pilih divisi</option>
                      {assignmentData.divisions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                )}
                <button type="submit" disabled={isSaving || !memberId}>
                  Tambah penugasan
                </button>
              </form>
              {assignmentData.assignments.length === 0 ? (
                <p className={styles.empty}>Belum ada susunan pengurus untuk periode ini.</p>
              ) : (
                <ul className={styles.assignmentList}>
                  {assignmentData.assignments.map((item) => {
                    const positionLabel =
                      officerPositions.find(({ key }) => key === item.position)?.label ?? item.position;
                    return (
                      <li key={item.id}>
                        <span>
                          <strong>{item.member.fullName}</strong>
                          <small>{positionLabel}{item.division ? ` · ${item.division}` : ""} · NIM ${item.member.nim}</small>
                        </span>
                        <button
                          type="button"
                          className={styles.removeButton}
                          disabled={isSaving}
                          onClick={() => void removeAssignment(item.id)}
                        >
                          Hapus
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}
