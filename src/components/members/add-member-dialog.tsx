import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { membershipStatuses, type Member, type MembershipStatus } from "./member-data";
import memberStyles from "./member-controls.module.css";
import styles from "./member-dialog.module.css";
import { MemberDialog } from "./member-dialog";

type AddMemberDialogProps = {
  onClose: () => void;
  onSubmit: (member: Omit<Member, "id">) => void;
};

export function AddMemberDialog({ onClose, onSubmit }: AddMemberDialogProps) {
  const [name, setName] = useState("");
  const [nim, setNim] = useState("");
  const [division, setDivision] = useState("Software Development");
  const [cohort, setCohort] = useState("2026");
  const [status, setStatus] = useState<MembershipStatus>("Aktif");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      name: name.trim(),
      nim: nim.trim(),
      division,
      cohort,
      status,
      attendance: null,
      joinedAt: "10 Nov 2026",
    });
  }

  return (
    <MemberDialog labelledBy="add-member-title" onClose={onClose}>
        <div className={styles.dialogHeading}>
          <div>
            <span className={styles.dialogEyebrow}>DATA ANGGOTA</span>
            <h2 id="add-member-title">Tambah anggota</h2>
            <p>Lengkapi identitas anggota untuk periode aktif.</p>
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
              placeholder="Contoh: Nabila Putri"
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
              <select value={division} onChange={(event) => setDivision(event.target.value)}>
                <option>Software Development</option>
                <option>Network &amp; Security</option>
                <option>UI/UX Design</option>
                <option>Research &amp; Development</option>
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
            Data hanya ditambahkan pada pratinjau ini dan belum tersimpan ke server.
          </p>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className={`${memberStyles.addButton} ${styles.dialogSubmitButton}`}
            >
              Tambahkan anggota
            </button>
          </div>
        </form>
    </MemberDialog>
  );
}
