import { Download, FileDown, Plus, Search, Upload } from "lucide-react";
import styles from "./member-controls.module.css";

type MemberToolbarProps = {
  search: string;
  division: string;
  divisions: string[];
  isImporting: boolean;
  onSearchChange: (value: string) => void;
  onDivisionChange: (value: string) => void;
  onImport: (file: File | undefined) => void | Promise<void>;
  onDownloadTemplate: () => void;
  onAddMember: () => void;
};

export function MemberToolbar({
  search,
  division,
  divisions,
  isImporting,
  onSearchChange,
  onDivisionChange,
  onImport,
  onDownloadTemplate,
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

        <button
          type="button"
          className={styles.exportButton}
          onClick={onDownloadTemplate}
        >
          <Download size={15} aria-hidden="true" />
          <span>Template</span>
        </button>

        <label className={styles.importButton}>
          <Upload size={15} aria-hidden="true" />
          <span>{isImporting ? "Mengimpor..." : "Import Excel"}</span>
          <input
            type="file"
            accept=".xlsx"
            aria-label="Pilih file Excel anggota"
            disabled={isImporting}
            onChange={(event) => {
              void onImport(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </label>

        <button type="button" className={styles.exportButton} disabled title="Export belum tersedia">
          <FileDown size={15} aria-hidden="true" />
          <span>Export</span>
        </button>

        <button type="button" className={styles.addButton} onClick={onAddMember}>
          <Plus size={16} aria-hidden="true" />
          <span>Tambah anggota</span>
        </button>
      </div>
    </div>
  );
}
