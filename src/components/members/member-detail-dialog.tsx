import { AtSign, CalendarDays, GraduationCap, Hash, UsersRound, X } from "lucide-react";
import { getInitials, type Member, type MembershipStatus } from "./member-data";
import memberStyles from "./members.module.css";
import styles from "./member-dialog.module.css";
import { MemberDialog } from "./member-dialog";

const statusClassNames: Record<MembershipStatus, string> = {
  Aktif: memberStyles.activeBadge,
  Cuti: memberStyles.leaveBadge,
  Keluar: memberStyles.exitedBadge,
  Alumni: memberStyles.alumniBadge,
};

type MemberDetailDialogProps = {
  member: Member;
  onClose: () => void;
};

export function MemberDetailDialog({ member, onClose }: MemberDetailDialogProps) {
  return (
    <MemberDialog
      labelledBy="member-detail-title"
      onClose={onClose}
      className={styles.detailDialog}
    >
        <div className={styles.dialogHeading}>
          <div>
            <span className={styles.dialogEyebrow}>PROFIL ANGGOTA</span>
            <h2 id="member-detail-title">Detail anggota</h2>
          </div>
          <button
            type="button"
            className={styles.dialogClose}
            onClick={onClose}
            aria-label="Tutup detail"
          >
            <X size={19} />
          </button>
        </div>

        <div className={styles.detailIdentity}>
          <span className={`${memberStyles.memberAvatar} ${styles.detailAvatar}`}>
            {getInitials(member.name)}
          </span>
          <div>
            <h3>{member.name}</h3>
            <span>{member.nim}</span>
            <span>{member.email}</span>
          </div>
          <span className={`${memberStyles.statusBadge} ${statusClassNames[member.status]} ${styles.detailStatusBadge}`}>
            <span aria-hidden="true" />
            {member.status}
          </span>
        </div>

        <dl className={styles.detailList}>
          <div>
            <dt><AtSign size={15} /> Email akun</dt>
            <dd>{member.email}</dd>
          </div>
          <div>
            <dt><Hash size={15} /> ID anggota</dt>
            <dd>{member.id}</dd>
          </div>
          <div>
            <dt><UsersRound size={15} /> Divisi</dt>
            <dd>{member.division}</dd>
          </div>
          <div>
            <dt><GraduationCap size={15} /> Angkatan</dt>
            <dd>{member.cohort}</dd>
          </div>
          <div>
            <dt><CalendarDays size={15} /> Bergabung</dt>
            <dd>{member.joinedAt}</dd>
          </div>
        </dl>

        <div className={styles.detailAttendance}>
          <span>Rata-rata kehadiran</span>
          <strong>{member.attendance === null ? "Belum ada data" : `${member.attendance}%`}</strong>
        </div>
        <p className={styles.dialogNote}>
          QR anggota dan riwayat kehadiran akan tampil setelah fitur absensi
          terhubung ke data anggota.
        </p>
    </MemberDialog>
  );
}
