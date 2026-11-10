"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, UserRoundX, UsersRound } from "lucide-react";
import { AddMemberDialog } from "./add-member-dialog";
import { initialMembers, type Member } from "./member-data";
import { MemberDetailDialog } from "./member-detail-dialog";
import { MemberStatusTabs, type StatusFilter } from "./member-status-tabs";
import { MemberTable } from "./member-table";
import { MemberToolbar } from "./member-toolbar";
import styles from "./members.module.css";

const pageSize = 8;

export function MembersPage() {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [division, setDivision] = useState("Semua");
  const [status, setStatus] = useState<StatusFilter>("Semua");
  const [page, setPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [importName, setImportName] = useState("");
  const [notice, setNotice] = useState("");

  const divisions = useMemo(
    () => [...new Set(members.map((member) => member.division))].sort(),
    [members],
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

  function addMember(memberDetails: Omit<Member, "id">) {
    const newMember: Member = {
      ...memberDetails,
      id: `RTX-2026-${String(members.length + 1).padStart(3, "0")}`,
    };

    setMembers((currentMembers) => [newMember, ...currentMembers]);
    setStatus("Semua");
    setDivision("Semua");
    setSearch("");
    setPage(1);
    setIsAddDialogOpen(false);
    setNotice(`${newMember.name} ditambahkan ke pratinjau. Data belum tersimpan ke server.`);
  }

  function importFile(file: File | undefined) {
    if (!file) return;
    setImportName(file.name);
    setNotice(`File ${file.name} dipilih. Import belum memproses atau mengunggah data.`);
  }

  const activeCount = members.filter((member) => member.status === "Aktif").length;
  const pausedCount = members.filter((member) => member.status === "Cuti").length;
  const alumniCount = members.filter(
    (member) => member.status === "Alumni" || member.status === "Keluar",
  ).length;

  return (
    <div className={styles.membersPage}>
      <header className={styles.pageHeading}>
        <div>
          <span className={styles.pageEyebrow}>KEANGGOTAAN · PERIODE 2026—2027</span>
          <h1>Anggota</h1>
          <p>Kelola data dan pantau perkembangan anggota RESTEX.</p>
        </div>
        <button type="button" className={styles.exportTopButton} disabled title="Export Excel tersedia setelah backend disambungkan">
          <ArrowDownToLine size={16} aria-hidden="true" />
          Export Excel
        </button>
      </header>

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
          <strong>2026 — 2027</strong>
        </div>
      </section>

      <section className={styles.membersCard} aria-label="Daftar anggota">
        <div className={styles.cardIntro}>
          <div>
            <h2>Daftar anggota</h2>
            <p>Data keanggotaan pada periode yang sedang berjalan.</p>
          </div>
          <span className={styles.currentPeriodBadge}>2026 — 2027</span>
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
          importName={importName}
          onSearchChange={updateSearch}
          onDivisionChange={updateDivision}
          onImport={importFile}
          onAddMember={() => setIsAddDialogOpen(true)}
        />
        <p className={styles.visuallyHidden} role="status" aria-live="polite">
          {notice}
        </p>
        <MemberTable
          members={visibleMembers}
          totalFiltered={filteredMembers.length}
          page={Math.min(page, pageCount)}
          pageSize={pageSize}
          activeStatus={status}
          onPageChange={setPage}
          onViewMember={setSelectedMember}
        />
      </section>

      <p className={styles.mockDataNote}>
        Data contoh untuk pratinjau UI. Perubahan hanya tersimpan sementara di browser.
      </p>

      {isAddDialogOpen && (
        <AddMemberDialog
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
    </div>
  );
}
