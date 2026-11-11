import type { Member } from "@/components/members/member-data";
import type { LanyardCardDetails } from "./types";
import styles from "./lanyard-card.module.css";

type LanyardCardFormProps = {
  members: Member[];
  selectedMemberId: string;
  details: LanyardCardDetails;
  hasProfilePhoto: boolean;
  onMemberChange: (memberId: string) => void;
  onFieldChange: (field: keyof LanyardCardDetails, value: string) => void;
};

export function LanyardCardForm({
  members,
  selectedMemberId,
  details,
  hasProfilePhoto,
  onMemberChange,
  onFieldChange,
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

        <div className={styles.field}>
          <span>Foto anggota</span>
          <div className={styles.photoSync}>
            <span className={styles.photoSyncDot} aria-hidden="true" />
            <span>
              <strong>{hasProfilePhoto ? "Foto profil terhubung" : "Belum ada foto profil"}</strong>
              <small>
                {hasProfilePhoto
                  ? "Foto ini otomatis digunakan pada kartu lanyard."
                  : "Anggota dapat menambahkan foto melalui halaman Profil."}
              </small>
            </span>
          </div>
        </div>
      </div>

      <p className={styles.localNotice}>
        Perubahan data identitas di sini hanya untuk pratinjau. Nama dan foto resmi mengikuti profil anggota.
      </p>
    </section>
  );
}
