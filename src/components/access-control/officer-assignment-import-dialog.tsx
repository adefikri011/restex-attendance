"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  KeyRound,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MAX_OFFICER_IMPORT_FILE_SIZE,
  MAX_OFFICER_IMPORT_ROWS,
} from "@/lib/officer-assignment-import-constants";
import { initialAccountPassword } from "@/lib/account-credentials";
import { downloadAccountCredentials } from "@/lib/download-account-credentials";
import styles from "./officer-assignment-import-dialog.module.css";

type PreviewRow = {
  rowNumber: number;
  nim: string;
  name: string;
  cohort: string | null;
  memberAction: "existing" | "create";
  positionLabel: string;
  division: string | null;
  accountEmail: string;
  accountAction: "existing" | "create" | "activate" | "same-file";
};

type PreviewIssue = { row: number; message: string };
type AccountCredential = {
  id: string;
  name: string;
  nim: string;
  email: string;
  initialPassword: string;
};
type ImportCompletion = {
  createdCount: number;
  createdMembersCount: number;
  createdAccounts: AccountCredential[];
};
type ImportPhase = "preview-upload" | "preview-processing" | "commit-upload" | "commit-processing";

type OfficerAssignmentImportDialogProps = {
  open: boolean;
  periodId: string;
  onClose: () => void;
  onImported: (result: ImportCompletion) => void | Promise<void>;
};

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAccountCredential(value: unknown): value is AccountCredential {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.nim === "string" &&
    typeof value.email === "string" &&
    typeof value.initialPassword === "string"
  );
}

function postImportFile(
  file: File,
  periodId: string,
  mode: "preview" | "commit",
  onProgress: (progress: number) => void,
  onUploadComplete: () => void,
) {
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("periodId", periodId);
    formData.set("mode", mode);
    const request = new XMLHttpRequest();
    request.open("POST", "/api/officer-assignments/import");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.upload.onload = onUploadComplete;
    request.onload = () => {
      let body: unknown;
      try {
        body = JSON.parse(request.responseText);
      } catch {
        reject(new Error("Respons server tidak dapat dibaca."));
        return;
      }
      resolve({ status: request.status, body });
    };
    request.onerror = () => reject(new Error("File gagal dikirim. Periksa koneksi lalu coba lagi."));
    request.onabort = () => reject(new Error("Unggahan dibatalkan."));
    request.send(formData);
  });
}

export function OfficerAssignmentImportDialog({
  open,
  periodId,
  onClose,
  onImported,
}: OfficerAssignmentImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [issues, setIssues] = useState<PreviewIssue[]>([]);
  const [totalIssueCount, setTotalIssueCount] = useState(0);
  const [phase, setPhase] = useState<ImportPhase | null>(null);
  const [progress, setProgress] = useState(0);
  const [completion, setCompletion] = useState<ImportCompletion | null>(null);

  const isBusy = phase !== null;

  function chooseFile(file: File | undefined) {
    if (isBusy) return;
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      setIssues([]);
      setTotalIssueCount(0);
      setError("");
      setValidationError("");
      setCompletion(null);
      return;
    }
    setError("");
    setCompletion(null);
    setPreview(null);
    setIssues([]);
    setTotalIssueCount(0);
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setSelectedFile(null);
      setValidationError("Pilih file Excel dengan format .xlsx.");
      return;
    }
    if (!file.size) {
      setSelectedFile(null);
      setValidationError("File yang dipilih kosong.");
      return;
    }
    if (file.size > MAX_OFFICER_IMPORT_FILE_SIZE) {
      setSelectedFile(null);
      setValidationError("Ukuran file maksimal 2 MB.");
      return;
    }
    setSelectedFile(file);
    setValidationError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  function resetDialog() {
    if (isBusy) return;
    setSelectedFile(null);
    setValidationError("");
    setError("");
    setPreview(null);
    setIssues([]);
    setTotalIssueCount(0);
    setCompletion(null);
    onClose();
  }

  async function send(mode: "preview" | "commit") {
    if (!selectedFile) return;
    setError("");
    setProgress(0);
    setPhase(mode === "preview" ? "preview-upload" : "commit-upload");
    try {
      const response = await postImportFile(
        selectedFile,
        periodId,
        mode,
        setProgress,
        () => setPhase(mode === "preview" ? "preview-processing" : "commit-processing"),
      );
      if (!isRecord(response.body)) {
        throw new Error("Respons impor tidak valid.");
      }
      if (response.status < 200 || response.status >= 300) {
        const message =
          typeof response.body.error === "string"
            ? response.body.error
            : "Impor gagal diproses.";
        if (Array.isArray(response.body.issues)) {
          setIssues(response.body.issues as PreviewIssue[]);
          setTotalIssueCount(
            typeof response.body.totalIssueCount === "number"
              ? response.body.totalIssueCount
              : response.body.issues.length,
          );
        }
        throw new Error(message);
      }

      if (mode === "preview") {
        if (!Array.isArray(response.body.rows) || !Array.isArray(response.body.issues)) {
          throw new Error("Pratinjau impor tidak valid.");
        }
        setPreview(response.body.rows as PreviewRow[]);
        setIssues(response.body.issues as PreviewIssue[]);
        setTotalIssueCount(
          typeof response.body.totalIssueCount === "number"
            ? response.body.totalIssueCount
            : response.body.issues.length,
        );
        return;
      }

      if (
        typeof response.body.createdCount !== "number" ||
        typeof response.body.createdMembersCount !== "number" ||
        !Array.isArray(response.body.createdAccounts) ||
        !response.body.createdAccounts.every(isAccountCredential)
      ) {
        throw new Error("Ringkasan hasil impor tidak valid.");
      }
      const result = {
        createdCount: response.body.createdCount,
        createdMembersCount: response.body.createdMembersCount,
        createdAccounts: response.body.createdAccounts,
      };
      setCompletion(result);
      await onImported(result);
      setSelectedFile(null);
      setPreview(null);
      setIssues([]);
      setTotalIssueCount(0);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impor gagal diproses.");
    } finally {
      setPhase(null);
      setProgress(0);
    }
  }

  const canCommit = preview !== null && preview.length > 0 && totalIssueCount === 0;
  const phaseLabel =
    phase === "preview-upload" || phase === "commit-upload"
      ? "Mengunggah file..."
      : phase === "preview-processing"
        ? "Memeriksa anggota dan jabatan..."
        : "Menyimpan anggota dan susunan...";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetDialog();
      }}
    >
      <DialogContent
        className={styles.content}
        overlayClassName={styles.overlay}
        showCloseButton={false}
      >
        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden="true">
            <FileSpreadsheet size={19} />
          </span>
          <div className={styles.heading}>
            <span className={styles.eyebrow}>SUSUNAN PER PERIODE · IMPOR</span>
            <DialogTitle className={styles.title}>Import pengurus</DialogTitle>
            <DialogDescription className={styles.description}>
              Unggah daftar Excel untuk mendaftarkan anggota, membuat akun, dan menetapkan jabatan sekaligus.
            </DialogDescription>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Tutup dialog import"
            onClick={resetDialog}
            disabled={isBusy}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          {completion ? (
            <section className={styles.completion} aria-label="Ringkasan impor selesai">
              <header>
                <span><CheckCircle2 size={17} aria-hidden="true" /></span>
                <div>
                  <h3>Impor selesai</h3>
                  <p>
                    {completion.createdMembersCount} anggota baru dan {completion.createdCount} penugasan ditambahkan.
                  </p>
                </div>
              </header>
              {completion.createdAccounts.length ? (
                <>
                  <p className={styles.credentialNote}>
                    <KeyRound size={15} aria-hidden="true" />
                    {completion.createdAccounts.length} akun baru dibuat. Password awalnya{" "}
                    <strong>{initialAccountPassword}</strong>.
                  </p>
                  <div className={styles.credentialList}>
                    {completion.createdAccounts.map((account) => (
                      <div key={account.id}>
                        <strong>{account.name}</strong>
                        <small>{account.nim}</small>
                        <span>{account.email}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.credentialDownload}
                    onClick={() =>
                      downloadAccountCredentials(
                        completion.createdAccounts,
                        "kredensial-awal-pengurus.csv",
                      )
                    }
                  >
                    <Copy size={14} aria-hidden="true" />
                    Unduh kredensial (.csv)
                  </button>
                </>
              ) : (
                <p>Semua anggota sudah memiliki akun tertaut. Tidak ada akun baru yang dibuat.</p>
              )}
            </section>
          ) : (
            <>
          <a className={styles.templateLink} href="/api/officer-assignments/template" download>
            <Download size={15} aria-hidden="true" />
            Unduh template pengurus
          </a>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept=".xlsx"
            aria-label="Pilih file Excel pengurus"
            onChange={handleFileChange}
            disabled={isBusy}
          />
          <button
            type="button"
            className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            disabled={isBusy}
          >
            <span className={styles.uploadIcon} aria-hidden="true">
              <Upload size={20} />
            </span>
            <strong>Tarik file Excel ke sini</strong>
            <span>atau klik untuk memilih dari perangkat</span>
            <span className={styles.browseLabel}>Pilih file .xlsx</span>
          </button>
          <p className={styles.fileRequirements}>
            Format .xlsx · Maksimal 2 MB · Hingga {MAX_OFFICER_IMPORT_ROWS} baris
          </p>

          {selectedFile && (
            <div className={styles.selectedFile}>
              <span className={styles.fileIcon} aria-hidden="true">
                <FileSpreadsheet size={18} />
              </span>
              <span className={styles.fileDetails}>
                <strong>{selectedFile.name}</strong>
                <span>{formatFileSize(selectedFile.size)}</span>
              </span>
              <button
                type="button"
                className={styles.removeFile}
                aria-label="Hapus file yang dipilih"
                onClick={() => chooseFile(undefined)}
                disabled={isBusy}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {(validationError || error) && (
            <p className={styles.errorMessage} role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{validationError || error}</span>
            </p>
          )}

          {preview && (
            <section className={styles.preview} aria-label="Pratinjau penugasan">
              <div className={styles.previewHeading}>
                {totalIssueCount === 0 ? (
                  <CheckCircle2 size={17} aria-hidden="true" />
                ) : (
                  <AlertCircle size={17} aria-hidden="true" />
                )}
                <p>
                  {totalIssueCount === 0
                    ? `${preview.length} penugasan siap disimpan.`
                    : `${totalIssueCount} masalah ditemukan. Perbaiki file lalu unggah ulang.`}
                </p>
              </div>
              {issues.length > 0 && (
                <ul className={styles.issueList}>
                  {issues.map((issue, index) => (
                    <li key={`${issue.row}:${index}`}>
                      Baris {issue.row}: {issue.message}
                    </li>
                  ))}
                  {totalIssueCount > issues.length && (
                    <li>Masih ada {totalIssueCount - issues.length} masalah lainnya.</li>
                  )}
                </ul>
              )}
              {preview.length > 0 && (
                <div className={styles.previewTableWrap}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        <th>Baris</th>
                        <th>Anggota</th>
                        <th>Angkatan</th>
                        <th>Jabatan</th>
                        <th>Divisi</th>
                        <th>Akun login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row) => (
                        <tr key={row.rowNumber}>
                          <td>{row.rowNumber}</td>
                          <td>
                            <strong>{row.name}</strong>
                            <small>{row.nim}</small>
                            {row.memberAction === "create" && <small>Anggota baru</small>}
                          </td>
                          <td>{row.cohort ?? "—"}</td>
                          <td>{row.positionLabel}</td>
                          <td>{row.division ?? "—"}</td>
                          <td>
                            <small>
                              {row.accountAction === "create"
                                ? "Akun baru"
                                : row.accountAction === "same-file"
                                  ? "Akun dibuat untuk baris lain"
                                  : row.accountAction === "activate"
                                    ? "Akun diaktifkan"
                                    : "Akun sudah tertaut"}
                            </small>
                            <small>{row.accountEmail}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {isBusy && (
            <div className={styles.progressSection}>
              <div className={styles.progressLabel} aria-live="polite">
                <span>{phaseLabel}</span>
                {(phase === "preview-upload" || phase === "commit-upload") && (
                  <strong>{progress}%</strong>
                )}
              </div>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label={phaseLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={
                  phase === "preview-upload" || phase === "commit-upload"
                    ? progress
                    : undefined
                }
              >
                <span
                  className={
                    phase === "preview-upload" || phase === "commit-upload"
                      ? styles.uploadProgress
                      : styles.processingProgress
                  }
                  style={
                    phase === "preview-upload" || phase === "commit-upload"
                      ? { width: `${progress}%` }
                      : undefined
                  }
                />
              </div>
              <p>Jangan tutup halaman selama impor berlangsung.</p>
            </div>
          )}
            </>
          )}
        </div>

        <DialogFooter className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={resetDialog}
            disabled={isBusy}
          >
            Batal
          </button>
          {completion ? (
            <button type="button" className={styles.importAction} onClick={resetDialog}>
              Tutup
            </button>
          ) : canCommit ? (
            <button
              type="button"
              className={styles.importAction}
              onClick={() => void send("commit")}
              disabled={isBusy}
            >
              {isBusy ? (
                <>
                  <Loader2 className={styles.spinner} size={15} aria-hidden="true" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  Simpan {preview.length} penugasan
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className={styles.importAction}
              onClick={() => void send("preview")}
              disabled={!selectedFile || isBusy}
            >
              {isBusy ? (
                <>
                  <Loader2 className={styles.spinner} size={15} aria-hidden="true" />
                  Memeriksa...
                </>
              ) : (
                <>
                  <Upload size={15} aria-hidden="true" />
                  Periksa file
                </>
              )}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
