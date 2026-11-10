"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  generateMemberEmail,
  memberDivisions,
  membershipStatuses,
  type Member,
  type MembershipStatus,
} from "./member-data";
import memberStyles from "./member-controls.module.css";
import styles from "./member-dialog.module.css";
import { MemberDialog } from "./member-dialog";

type EditableMember = Pick<Member, "name" | "nim" | "division" | "cohort" | "status">;

type EditMemberDialogProps = {
  member: Member;
  periodName: string;
  onClose: () => void;
  onSave: (member: EditableMember) => Promise<{ error?: string }>;
};

export function EditMemberDialog({
  member,
  periodName,
  onClose,
  onSave,
}: EditMemberDialogProps) {
  const [name, setName] = useState(member.name);
  const [nim, setNim] = useState(member.nim);
  const [division, setDivision] = useState(member.division);
  const [cohort, setCohort] = useState(member.cohort);
  const [status, setStatus] = useState<MembershipStatus>(member.status);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailPreview = generateMemberEmail(name, division, periodName);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await onSave({
        name: name.trim(),
        nim: nim.trim(),
        division,
        cohort: cohort.trim(),
        status,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MemberDialog labelledBy="edit-member-title" onClose={onClose}>
      <div className={styles.dialogHeading}>
        <div>
          <span className={styles.dialogEyebrow}>DATA ANGGOTA · {member.id}</span>
          <h2 id="edit-member-title">Edit data anggota</h2>
          <p>Perbarui identitas dan keanggotaan periode {periodName}.</p>
        </div>
        <button
          type="button"
          className={styles.dialogClose}
          onClick={onClose}
          aria-label="Tutup form edit"
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
            minLength={2}
            maxLength={160}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          NIM
          <input
            required
            maxLength={32}
            value={nim}
            onChange={(event) => setNim(event.target.value)}
          />
        </label>
        <div className={styles.formRow}>
          <label>
            Divisi
            <select
              value={division}
              onChange={(event) => setDivision(event.target.value)}
            >
              {memberDivisions.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Angkatan
            <input
              required
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              value={cohort}
              onChange={(event) => setCohort(event.target.value)}
              aria-describedby="edit-member-cohort-hint"
            />
            <small id="edit-member-cohort-hint">Gunakan tahun angkatan 4 digit.</small>
          </label>
        </div>
        <label>
          Email akun anggota
          <input
            className={styles.generatedEmailInput}
            readOnly
            value={emailPreview}
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
          NIM, nama, divisi, angkatan, dan status dapat diubah. ID anggota tetap.
          Perubahan nama atau divisi akan memperbarui email login otomatis; password
          tidak berubah. Status selain Aktif menonaktifkan akses login.
        </p>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            className={`${memberStyles.addButton} ${styles.dialogSubmitButton}`}
            disabled={isSubmitting || !emailPreview}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </div>
      </form>
    </MemberDialog>
  );
}
