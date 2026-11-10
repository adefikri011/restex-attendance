import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  getInitials,
  type Member,
  type MembershipStatus,
} from "./member-data";
import styles from "./member-table.module.css";
import sharedStyles from "./members.module.css";

const statusClassNames: Record<MembershipStatus, string> = {
  Aktif: sharedStyles.activeBadge,
  Cuti: sharedStyles.leaveBadge,
  Keluar: sharedStyles.exitedBadge,
  Alumni: sharedStyles.alumniBadge,
};

type MemberTableProps = {
  members: Member[];
  totalFiltered: number;
  page: number;
  pageSize: number;
  activeStatus: MembershipStatus | "Semua";
  onPageChange: (page: number) => void;
  onViewMember: (member: Member) => void;
};

export function MemberTable({
  members,
  totalFiltered,
  page,
  pageSize,
  activeStatus,
  onPageChange,
  onViewMember,
}: MemberTableProps) {
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const firstItem = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalFiltered);

  return (
    <div
      className={styles.tableArea}
      id="member-list-panel"
      role="tabpanel"
      aria-labelledby={`member-tab-${activeStatus.toLowerCase()}`}
    >
      {members.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>?</span>
          <h3>Anggota tidak ditemukan</h3>
          <p>Coba ubah kata pencarian atau filter yang digunakan.</p>
        </div>
      ) : (
        <div className={styles.tableScroller}>
          <table className={styles.memberTable}>
            <thead>
              <tr>
                <th scope="col">ANGGOTA</th>
                <th scope="col">ID ANGGOTA</th>
                <th scope="col">DIVISI</th>
                <th scope="col">ANGKATAN</th>
                <th scope="col">KEHADIRAN</th>
                <th scope="col">STATUS</th>
                <th scope="col">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => (
                <tr key={member.id}>
                  <td>
                    <button
                      type="button"
                      className={styles.memberIdentity}
                      onClick={() => onViewMember(member)}
                    >
                      <span className={`${sharedStyles.memberAvatar} ${styles[`avatarTone${(index % 5) + 1}`]}`}>
                        {getInitials(member.name)}
                      </span>
                      <span className={styles.memberNameBlock}>
                        <strong>{member.name}</strong>
                        <small>{member.nim}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className={styles.memberCode}>{member.id}</span>
                  </td>
                  <td>
                    <span className={styles.divisionName}>{member.division}</span>
                  </td>
                  <td>
                    <span className={styles.cohortPill}>{member.cohort}</span>
                  </td>
                  <td>
                    {member.attendance === null ? (
                      <span className={styles.noAttendance}>Belum ada data</span>
                    ) : (
                      <span className={styles.attendanceValue}>
                        <span className={styles.attendanceTrack}>
                          <span style={{ width: `${member.attendance}%` }} />
                        </span>
                        <strong>{member.attendance}%</strong>
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`${sharedStyles.statusBadge} ${statusClassNames[member.status]}`}>
                      <span aria-hidden="true" />
                      {member.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.rowAction}
                      aria-label={`Lihat detail ${member.name}`}
                      onClick={() => onViewMember(member)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.tableFooter}>
        <p>
          Menampilkan <strong>{firstItem}–{lastItem}</strong> dari{" "}
          <strong>{totalFiltered}</strong> anggota
        </p>
        <div className={styles.pagination}>
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Halaman <strong>{page}</strong> dari <strong>{pageCount}</strong>
          </span>
          <button
            type="button"
            aria-label="Halaman selanjutnya"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
