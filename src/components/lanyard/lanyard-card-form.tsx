import { ImagePlus } from "lucide-react";
import type { Member } from "@/components/members/member-data";
import type { LanyardCardDetails } from "./types";
import styles from "./lanyard-card.module.css";

type LanyardCardFormProps = {
  members: Member[];
  selectedMemberId: string;
  details: LanyardCardDetails;
  photoName: string;
  onMemberChange: (memberId: string) => void;
  onFieldChange: (field: keyof LanyardCardDetails, value: string) => void;
  onPhotoChange: (file: File | undefined) => void;
};

export function LanyardCardForm({
  members,
  selectedMemberId,
  details,
  photoName,
  onMemberChange,
  onFieldChange,
  onPhotoChange,
}: LanyardCardFormProps) {
  const divisions = [...new Set(members.map((member) => member.division))].sort();
  const cohorts = [...new Set(members.map((member) => member.cohort))].sort().reverse();

  return (
    <section className={styles.formPanel} aria-labelledby="card-form-title">
      <div className={styles.panelHeading}>
        <span className={styles.panelEyebrow}>DATA KARTU</span>
        <h2 id="card-form-title">Identitas anggota</h2>
        <p>Perubahan di sini langsung terlihat pada kartu.</p>
      </div>

      <div className={styles.formFields}>
        <label className={styles.field}>
          <span>Pilih anggota aktif</span>
          <select
            value={selectedMemberId}
            onChange={(event) => onMemberChange(event.target.value)}
          >
            {members.map((member) => (
              <option value={member.id} key={member.id}>
                {member.name} · {member.id}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.formDivider}>
          <span>atau sesuaikan data untuk pratinjau</span>
        </div>

        <label className={styles.field}>
          <span>Nama lengkap</span>
          <input
            value={details.name}
            maxLength={60}
            onChange={(event) => onFieldChange("name", event.target.value)}
            placeholder="Nama yang dicetak pada kartu"
          />
        </label>

        <label className={styles.field}>
          <span>NIM</span>
          <input
            value={details.nim}
            maxLength={20}
            onChange={(event) => onFieldChange("nim", event.target.value)}
            placeholder="Nomor induk mahasiswa"
          />
        </label>

        <label className={styles.field}>
          <span>Divisi</span>
          <select
            value={details.division}
            onChange={(event) => onFieldChange("division", event.target.value)}
          >
            {divisions.map((division) => (
              <option value={division} key={division}>
                {division}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Angkatan</span>
          <select
            value={details.cohort}
            onChange={(event) => onFieldChange("cohort", event.target.value)}
          >
            {cohorts.map((cohort) => (
              <option value={cohort} key={cohort}>
                {cohort}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Foto anggota <span className={styles.optional}>(opsional)</span></span>
          <span className={styles.filePicker}>
            <ImagePlus size={17} aria-hidden="true" />
            <span>{photoName || "Pilih foto dari perangkat"}</span>
            <input
              type="file"
              accept="image/*"
              aria-label="Pilih foto anggota"
              onChange={(event) => onPhotoChange(event.target.files?.[0])}
            />
          </span>
          <span className={styles.fieldHint}>Foto hanya digunakan di pratinjau pada perangkat ini.</span>
        </label>
      </div>

      <p className={styles.localNotice}>
        Data yang diedit di halaman ini hanya untuk pratinjau dan tidak mengubah data anggota.
      </p>
    </section>
  );
}
