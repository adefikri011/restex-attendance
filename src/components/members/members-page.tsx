"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, Building2, Copy, KeyRound, UserRoundX, UsersRound, X } from "lucide-react";
import { AddMemberDialog } from "./add-member-dialog";
import { EditMemberDialog } from "./edit-member-dialog";
import { initialAccountPassword } from "@/lib/account-credentials";
import {
  membershipStatuses,
  type Member,
  type MemberCredential,
  type MembershipStatus,
} from "./member-data";
import { MemberDetailDialog } from "./member-detail-dialog";
import { MemberStatusTabs, type StatusFilter } from "./member-status-tabs";
import { MemberTable } from "./member-table";
import { MemberToolbar } from "./member-toolbar";
import { DivisionManager } from "./division-manager";
import styles from "./members.module.css";
import type { DivisionSummary } from "@/lib/division-service";

const pageSize = 8;

type MembersPageProps = {
  initialDivisions: DivisionSummary[];
  initialMembers: Member[];
  periodName: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMembershipStatus(value: string): value is MembershipStatus {
  return membershipStatuses.some((status) => status === value);
}

function isMemberCredential(value: unknown): value is MemberCredential {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.nim === "string" &&
    typeof value.division === "string" &&
    typeof value.cohort === "string" &&
    typeof value.status === "string" &&
    isMembershipStatus(value.status) &&
    (typeof value.attendance === "number" || value.attendance === null) &&
    typeof value.joinedAt === "string" &&
    typeof value.initialPassword === "string"
  );
}

function isMember(value: unknown): value is Member {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.nim === "string" &&
    typeof value.division === "string" &&
    typeof value.cohort === "string" &&
    typeof value.status === "string" &&
    isMembershipStatus(value.status) &&
    (typeof value.attendance === "number" || value.attendance === null) &&
    typeof value.joinedAt === "string"
  );
}

function withoutCredential({ id, name, email, nim, division, cohort, status, attendance, joinedAt }: MemberCredential): Member {
  return { id, name, email, nim, division, cohort, status, attendance, joinedAt };
}

function escapeCsvCell(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function downloadCredentials(credentials: MemberCredential[]) {
  const rows = [
    ["Nama", "Email", "Password awal"],
    ...credentials.map(({ name, email, initialPassword }) => [
      name,
      email,
      initialPassword,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "kredensial-awal-anggota.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function MembersPage({ initialDivisions, initialMembers, periodName }: MembersPageProps) {
  const [members, setMembers] = useState(initialMembers);
  const [divisionRecords, setDivisionRecords] = useState(initialDivisions);
  const divisionNames = divisionRecords
    .filter(({ isActive }) => isActive)
    .map(({ name }) => name);
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState("Semua");
  const [status, setStatus] = useState<StatusFilter>("Semua");
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDivisionManagerOpen, setIsDivisionManagerOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [isNoticeError, setIsNoticeError] = useState(false);
  const [credentials, setCredentials] = useState<MemberCredential[]>([]);

  const divisions = useMemo(
    () => [...new Set([...divisionNames, ...members.map((member) => member.division)])].sort(),
    [divisionNames, members],
  );

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("id");

    return members.filter((member) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        member.name.toLocaleLowerCase("id").includes(normalizedSearch) ||
        member.nim.includes(normalizedSearch) ||
        member.id.toLocaleLowerCase("id").includes(normalizedSearch);
      const matchesDivision = division === "Semua" || member.division === division;
      const matchesStatus = status === "Semua" || member.status === status;

      return matchesSearch && matchesDivision && matchesStatus;
    });
  }, [division, members, search, status]);

  const pageCount = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const visibleMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function updateDivision(value: string) {
    setDivision(value);
    setPage(1);
  }

  function updateStatus(value: StatusFilter) {
    setStatus(value);
    setPage(1);
  }

  async function addMember(
    memberDetails: Pick<Member, "name" | "nim" | "division" | "cohort" | "status">,
  ) {
    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(memberDetails),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "Anggota gagal disimpan.";
        return { error: message };
      }

      if (!isRecord(result) || !isMemberCredential(result.member)) {
        return { error: "Respons server tidak valid. Muat ulang halaman dan periksa daftar anggota." };
      }

      const created = result.member;
      const member = withoutCredential(created);
      setMembers((currentMembers) => [member, ...currentMembers]);
      setCredentials([created]);
      setStatus("Semua");
      setDivision("Semua");
      setSearch("");
      setPage(1);
      setNotice(`${member.name} berhasil dibuat sebagai Anggota.`);
      setIsNoticeError(false);
      return {};
    } catch {
      return { error: "Layanan tidak dapat dihubungi. Periksa koneksi lalu coba kembali." };
    }
  }

  async function saveMember(
    memberDetails: Pick<Member, "name" | "nim" | "division" | "cohort" | "status">,
  ) {
    if (!editingMember) return { error: "Anggota yang dipilih tidak ditemukan." };

    try {
      const response = await fetch(
        `/api/members/${encodeURIComponent(editingMember.id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(memberDetails),
        },
      );
      const result: unknown = await response.json();

      if (!response.ok) {
        return {
          error:
            isRecord(result) && typeof result.error === "string"
              ? result.error
              : "Data anggota gagal diperbarui.",
        };
      }

      if (!isRecord(result) || !isMember(result.member)) {
        return { error: "Respons server tidak valid. Muat ulang halaman." };
      }
      const updatedMember = result.member;

      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member.id === updatedMember.id ? updatedMember : member,
        ),
      );
      setEditingMember(null);
      setNotice(`${updatedMember.name} berhasil diperbarui.`);
      setIsNoticeError(false);
      return {};
    } catch {
      return { error: "Layanan tidak dapat dihubungi. Coba kembali." };
    }
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    setIsImporting(true);
    setNotice("");
    setCredentials([]);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/members/import", {
        method: "POST",
        body: formData,
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : "File gagal diimpor.";
        const issues =
          isRecord(result) && Array.isArray(result.issues)
            ? result.issues
                .filter(
                  (issue): issue is { row: number; message: string } =>
                    isRecord(issue) &&
                    typeof issue.row === "number" &&
                    typeof issue.message === "string",
                )
                .slice(0, 8)
                .map((issue) => `Baris ${issue.row}: ${issue.message}`)
            : [];
        setNotice([message, ...issues].join(" "));
        setIsNoticeError(true);
        return;
      }

      if (
        !isRecord(result) ||
        !Array.isArray(result.members) ||
        !result.members.every(isMemberCredential)
      ) {
        setNotice("Respons server tidak valid. Muat ulang halaman dan periksa daftar anggota.");
        setIsNoticeError(true);
        return;
      }

      const created = result.members;
      setMembers((currentMembers) => [
        ...created.map(withoutCredential),
        ...currentMembers,
      ]);
      setCredentials(created);
      setStatus("Semua");
      setDivision("Semua");
      setSearch("");
      setPage(1);
      setNotice(`${created.length} anggota berhasil dibuat.`);
      setIsNoticeError(false);
    } catch {
      setNotice("File gagal diunggah. Periksa koneksi lalu coba kembali.");
      setIsNoticeError(true);
    } finally {
      setIsImporting(false);
    }
  }

  function downloadTemplate() {
    const link = document.createElement("a");
    link.href = "/api/members/template";
    link.download = "template-anggota-restex.xlsx";
    link.click();
  }

  const periodLabel = periodName?.replace("-", " — ") ?? "Belum diatur";
  const activeCount = members.filter((member) => member.status === "Aktif").length;
  const pausedCount = members.filter((member) => member.status === "Cuti").length;
  const alumniCount = members.filter(
    (member) => member.status === "Alumni" || member.status === "Keluar",
  ).length;

  return (
    <div className={styles.membersPage}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>KEANGGOTAAN · PERIODE {periodLabel}</span>
          <h1>Anggota</h1>
          <p>Data anggota pada periode aktif, tersimpan di database RESTEX.</p>
        </div>
        <div className={styles.headingActions}>
          <button
            type="button"
            className={styles.exportTopButton}
            aria-expanded={isDivisionManagerOpen}
            onClick={() => setIsDivisionManagerOpen((open) => !open)}
          >
            <Building2 size={16} aria-hidden="true" />
            Kelola divisi
          </button>
          <button type="button" className={styles.exportTopButton} disabled title="Export belum tersedia">
            <ArrowDownToLine size={16} aria-hidden="true" />
            Export Excel
          </button>
        </div>
      </header>

      {isDivisionManagerOpen && (
        <DivisionManager
          initialDivisions={divisionRecords}
          onDivisionsChange={(updated) => {
            for (const previous of divisionRecords) {
              const next = updated.find(({ id }) => id === previous.id);
              if (next && next.name !== previous.name) {
                setMembers((current) =>
                  current.map((member) =>
                    member.division === previous.name
                      ? { ...member, division: next.name }
                      : member,
                  ),
                );
              }
            }
            if (
              division !== "Semua" &&
              !updated.some(({ name, isActive }) => name === division && isActive)
            ) {
              setDivision("Semua");
            }
            setDivisionRecords(updated);
          }}
        />
      )}

      <section className={styles.summaryStrip} aria-label="Ringkasan keanggotaan">
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconNavy}`}>
            <UsersRound size={18} aria-hidden="true" />
          </span>
          <div>
            <span>Total anggota</span>
            <strong>{members.length}</strong>
          </div>
        </div>
        <span className={styles.summaryDivider} aria-hidden="true" />
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconGreen}`}>
            <span className={styles.summaryStatusDot} />
          </span>
          <div>
            <span>Aktif</span>
            <strong>{activeCount}</strong>
          </div>
        </div>
        <span className={styles.summaryDivider} aria-hidden="true" />
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconAmber}`}>
            <span className={styles.summaryStatusDot} />
          </span>
          <div>
            <span>Sedang cuti</span>
            <strong>{pausedCount}</strong>
          </div>
        </div>
        <span className={styles.summaryDivider} aria-hidden="true" />
        <div className={styles.summaryItem}>
          <span className={`${styles.summaryIcon} ${styles.summaryIconGray}`}>
            <UserRoundX size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Keluar &amp; alumni</span>
            <strong>{alumniCount}</strong>
          </div>
        </div>
        <div className={styles.summaryPeriod}>
          <span className={styles.periodLiveDot} />
          <span>Periode aktif</span>
          <strong>{periodLabel}</strong>
        </div>
      </section>

      <section className={styles.membersCard} aria-label="Daftar anggota">
        <div className={styles.cardIntro}>
          <div>
            <h2>Daftar anggota</h2>
            <p>Data keanggotaan pada periode yang sedang berjalan.</p>
          </div>
          <span className={styles.currentPeriodBadge}>{periodLabel}</span>
        </div>

        <MemberStatusTabs
          activeStatus={status}
          members={members}
          onChange={updateStatus}
        />
        <MemberToolbar
          search={search}
          division={division}
          divisions={divisions}
          isImporting={isImporting}
          onSearchChange={updateSearch}
          onDivisionChange={updateDivision}
          onImport={importFile}
          onDownloadTemplate={downloadTemplate}
          onAddMember={() => {
            setNotice("");
            setIsNoticeError(false);
            setIsAddDialogOpen(true);
          }}
        />
        {!periodName && (
          <p className={styles.importNotice} role="alert">
            Belum ada periode aktif. Atur periode terlebih dahulu sebelum membuat anggota.
          </p>
        )}
        {notice && (
          <p
            className={isNoticeError ? styles.importNotice : styles.successNotice}
            role={isNoticeError ? "alert" : "status"}
            aria-live="polite"
          >
            {notice}
          </p>
        )}
        {credentials.length > 0 && (
          <section className={styles.credentialsPanel} aria-labelledby="credentials-heading">
            <header>
              <div>
                <span><KeyRound size={15} aria-hidden="true" /></span>
                <div>
                  <h3 id="credentials-heading">Simpan kredensial awal</h3>
                  <p>Password awal semua akun anggota adalah {initialAccountPassword}.</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup kredensial awal"
                onClick={() => setCredentials([])}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.credentialsList}>
              {credentials.map(({ id, name, email, initialPassword }) => (
                <div className={styles.credentialRow} key={id}>
                  <strong>{name}</strong>
                  <span>{email}</span>
                  <code>{initialPassword}</code>
                </div>
              ))}
            </div>
            <button
              type="button"
              className={styles.credentialsDownload}
              onClick={() => downloadCredentials(credentials)}
            >
              <Copy size={14} aria-hidden="true" />
              Unduh kredensial (.csv)
            </button>
          </section>
        )}
        <MemberTable
          members={visibleMembers}
          totalFiltered={filteredMembers.length}
          page={Math.min(page, pageCount)}
          pageSize={pageSize}
          activeStatus={status}
          hasAnyMembers={members.length > 0}
          onPageChange={setPage}
          onViewMember={setSelectedMember}
          onEditMember={(member) => {
            setNotice("");
            setIsNoticeError(false);
            setEditingMember(member);
          }}
        />
      </section>

      {isAddDialogOpen && periodName && (
        <AddMemberDialog
          divisions={divisionNames}
          periodName={periodName}
          onClose={() => setIsAddDialogOpen(false)}
          onSubmit={addMember}
        />
      )}
      {selectedMember && (
        <MemberDetailDialog
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}
      {editingMember && periodName && (
        <EditMemberDialog
          divisions={divisionNames}
          member={editingMember}
          periodName={periodName}
          onClose={() => setEditingMember(null)}
          onSave={saveMember}
        />
      )}
    </div>
  );
}
