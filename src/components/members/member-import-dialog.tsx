"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  AlertCircle,
  FileSpreadsheet,
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
  MAX_MEMBER_IMPORT_FILE_SIZE,
  MAX_MEMBER_IMPORT_ROWS,
} from "@/lib/member-import-constants";
import styles from "./member-import-dialog.module.css";

type ImportStage = "uploading" | "processing" | null;

type MemberImportDialogProps = {
  open: boolean;
  isImporting: boolean;
  progress: number;
  stage: ImportStage;
  error: string;
  onClose: () => void;
  onClearError: () => void;
  onImport: (file: File) => void;
};

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function MemberImportDialog({
  open,
  isImporting,
  progress,
  stage,
  error,
  onClose,
  onClearError,
  onImport,
}: MemberImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState("");

  function chooseFile(file: File | undefined) {
    if (!file || isImporting) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setSelectedFile(null);
      setValidationError("Pilih file Excel dengan format .xlsx.");
      onClearError();
      return;
    }
    if (file.size === 0) {
      setSelectedFile(null);
      setValidationError("File yang dipilih kosong.");
      onClearError();
      return;
    }
    if (file.size > MAX_MEMBER_IMPORT_FILE_SIZE) {
      setSelectedFile(null);
      setValidationError("Ukuran file maksimal 2 MB.");
      onClearError();
      return;
    }

    setSelectedFile(file);
    setValidationError("");
    onClearError();
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

  function closeDialog() {
    if (isImporting) return;
    setSelectedFile(null);
    setValidationError("");
    onClearError();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) closeDialog();
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
            <span className={styles.eyebrow}>KEANGGOTAAN · IMPOR</span>
            <DialogTitle className={styles.title}>Import anggota</DialogTitle>
            <DialogDescription className={styles.description}>
              Unggah data anggota dari file Excel. Pastikan kolomnya mengikuti
              template yang tersedia.
            </DialogDescription>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Tutup dialog import"
            onClick={closeDialog}
            disabled={isImporting}
          >
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept=".xlsx"
            aria-label="Pilih file Excel anggota"
            onChange={handleFileChange}
            disabled={isImporting}
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
            disabled={isImporting}
          >
            <span className={styles.uploadIcon} aria-hidden="true">
              <Upload size={20} />
            </span>
            <strong>Tarik file Excel ke sini</strong>
            <span>atau klik untuk memilih dari perangkat</span>
            <span className={styles.browseLabel}>Pilih file .xlsx</span>
          </button>

          <p className={styles.fileRequirements}>
            Format .xlsx · Maksimal 2 MB · Hingga {MAX_MEMBER_IMPORT_ROWS} anggota
            per file
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
                onClick={() => setSelectedFile(null)}
                disabled={isImporting}
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

          {isImporting && (
            <div className={styles.progressSection}>
              <div className={styles.progressLabel} aria-live="polite">
                <span>
                  {stage === "processing"
                    ? "Memeriksa dan menyimpan anggota..."
                    : "Mengunggah file..."}
                </span>
                {stage === "uploading" && <strong>{progress}%</strong>}
              </div>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label={
                  stage === "processing" ? "Memproses file Excel" : "Mengunggah file"
                }
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={stage === "uploading" ? progress : undefined}
              >
                <span
                  className={
                    stage === "processing"
                      ? styles.processingProgress
                      : styles.uploadProgress
                  }
                  style={
                    stage === "uploading" ? { width: `${progress}%` } : undefined
                  }
                />
              </div>
              <p>Jangan tutup halaman selama impor berlangsung.</p>
            </div>
          )}
        </div>

        <DialogFooter className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={closeDialog}
            disabled={isImporting}
          >
            Batal
          </button>
          <button
            type="button"
            className={styles.importAction}
            onClick={() => {
              if (selectedFile) onImport(selectedFile);
            }}
            disabled={!selectedFile || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className={styles.spinner} size={15} aria-hidden="true" />
                Mengimpor...
              </>
            ) : (
              <>
                <Upload size={15} aria-hidden="true" />
                Mulai import
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
