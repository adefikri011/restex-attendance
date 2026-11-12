import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  generateMemberEmail,
  membershipStatuses,
  type Member,
  type MembershipStatus,
} from "./member-data";
import { initialAccountPassword } from "@/lib/account-credentials";
import { notifications } from "@/lib/notifications";
import memberStyles from "./member-controls.module.css";
import styles from "./member-dialog.module.css";
import { MemberDialog } from "./member-dialog";

type AddMemberDialogProps = {
  divisions: string[];
  periodName: string;
  onClose: () => void;
  onSubmit: (
    member: Pick<Member, "name" | "nim" | "division" | "cohort" | "status">,
  ) => Promise<{ error?: string }>;
};

export function AddMemberDialog({
  divisions,
  periodName,
  onClose,
  onSubmit,
}: AddMemberDialogProps) {
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [division, setDivision] = useState(divisions[0] ?? "");
  const [cohort, setCohort] = useState("2026");
  const [status, setStatus] = useState<MembershipStatus>("Aktif");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const generatedEmail = generateMemberEmail(name, division, periodName);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        name: name.trim(),
        nim: nim.trim(),
        division,
        cohort,
        status,
      });
      if (result.error) {
        notifications.error("Anggota gagal ditambahkan", result.error);
        return;
      }

      onClose();
    } catch (error) {
      notifications.error(
        "Anggota gagal ditambahkan",
        error instanceof Error ? error.message : "Layanan tidak dapat dihubungi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MemberDialog labelledBy="add-member-title" onClose={onClose}>
        <div className={styles.dialogHeading}>
          <div>
            <span className={styles.dialogEyebrow}>DATA ANGGOTA</span>
            <h2 id="add-member-title">Tambah anggota</h2>
            <p>Lengkapi identitas untuk periode {periodName}.</p>
          </div>
          <button
            type="button"
            className={styles.dialogClose}
            onClick={onClose}
            aria-label="Tutup form"
          >
            <X size={19} />
          </button>
        </div>

        <form className={styles.memberForm} onSubmit={handleSubmit}>
          <label>
            Nama lengkap
            <input
              data-autofocus
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama lengkap anggota"
            />
          </label>
          <label>
            NIM
            <input
              required
              inputMode="numeric"
              value={nim}
              onChange={(event) => setNim(event.target.value)}
              placeholder="Masukkan NIM"
            />
          </label>
          <div className={styles.formRow}>
            <label>
              Divisi
              <select
                required
                value={division}
                onChange={(event) => setDivision(event.target.value)}
                disabled={!divisions.length}
              >
                {divisions.map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Angkatan
              <select value={cohort} onChange={(event) => setCohort(event.target.value)}>
                <option>2026</option>
                <option>2025</option>
                <option>2024</option>
                <option>2023</option>
              </select>
            </label>
          </div>
          <label>
            Email akun anggota
            <input
              className={styles.generatedEmailInput}
              readOnly
              value={generatedEmail}
              placeholder="Isi nama untuk membuat email"
            />
          </label>
          <label>
            Status keanggotaan
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as MembershipStatus)}
            >
              {membershipStatuses.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <p className={styles.dialogNote}>
            {divisions.length
              ? "Akun dibuat dengan role Anggota. Email memakai nama, kode divisi,"
              : "Belum ada divisi aktif. Aktifkan atau tambahkan divisi terlebih dahulu."}
            {divisions.length > 0 && <>
            {" "}
            dan kode periode. Password awal semua anggota adalah
            <strong> {initialAccountPassword}</strong>.
            </>}
          </p>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className={`${memberStyles.addButton} ${styles.dialogSubmitButton}`}
              disabled={isSubmitting || !generatedEmail || !divisions.length}
            >
              {isSubmitting ? "Menyimpan..." : "Tambahkan anggota"}
            </button>
          </div>
        </form>
    </MemberDialog>
  );
}
