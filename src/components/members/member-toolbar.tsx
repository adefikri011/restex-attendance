import { FileDown, Plus, Search, Upload } from "lucide-react";
import styles from "./member-controls.module.css";

type MemberToolbarProps = {
  search: string;
  division: string;
  divisions: string[];
  importName: string;
  onSearchChange: (value: string) => void;
  onDivisionChange: (value: string) => void;
  onImport: (file: File | undefined) => void;
  onAddMember: () => void;
};

export function MemberToolbar({
  search,
  division,
  divisions,
  importName,
  onSearchChange,
  onDivisionChange,
  onImport,
  onAddMember,
}: MemberToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <label className={styles.searchField}>
        <Search size={17} aria-hidden="true" />
        <span className={styles.visuallyHidden}>Cari nama atau NIM</span>
        <input
          type="search"
          value={search}
          placeholder="Cari nama atau NIM..."
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className={styles.toolbarActions}>
        <label className={styles.divisionSelectLabel}>
          <span className={styles.visuallyHidden}>Filter divisi</span>
          <select
            value={division}
            onChange={(event) => onDivisionChange(event.target.value)}
            aria-label="Filter divisi"
          >
            <option value="Semua">Semua divisi</option>
            {divisions.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.importButton}>
          <Upload size={15} aria-hidden="true" />
          <span>Import</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            aria-label="Pilih file Excel anggota"
            onChange={(event) => onImport(event.target.files?.[0])}
          />
        </label>

        <button type="button" className={styles.exportButton} disabled title="Export tersedia setelah backend disambungkan">
          <FileDown size={15} aria-hidden="true" />
          <span>Export</span>
        </button>

        <button type="button" className={styles.addButton} onClick={onAddMember}>
          <Plus size={16} aria-hidden="true" />
          <span>Tambah anggota</span>
        </button>
      </div>

      {importName && (
        <p className={styles.importNote} role="status">
          <FileDown size={14} aria-hidden="true" />
          File dipilih: <strong>{importName}</strong> — data belum diunggah.
        </p>
      )}
    </div>
  );
}
