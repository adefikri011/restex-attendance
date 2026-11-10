import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  UsersRound,
} from "lucide-react";
import type { Member } from "@/components/members/member-data";
import {
  formatSessionDate,
  getActiveMembers,
  getSessionCounts,
  type AttendanceSession,
  type AttendanceStatus,
} from "./attendance-data";
import styles from "./attendance-session-detail.module.css";

type AttendanceSessionDetailProps = {
  session: AttendanceSession;
  members: Member[];
};

const statusClassNames: Record<AttendanceStatus, string> = {
  Hadir: styles.present,
  Izin: styles.excused,
  Sakit: styles.sick,
  Alpha: styles.absent,
};

export function AttendanceSessionDetail({
  session,
  members,
}: AttendanceSessionDetailProps) {
  const activeMembers = getActiveMembers(members);
  const counts = getSessionCounts(session, activeMembers.length);
  const isDraft = session.status === "Draft";
  const attendanceRecorded = session.attendance.length;
  const attendanceProgress = activeMembers.length
    ? Math.round((counts.hadir / activeMembers.length) * 100)
    : 0;

  return (
    <div className={styles.page}>
      <Link href="/attendance" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden="true" />
        Kembali ke monitoring
      </Link>

      <header className={styles.heading}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>DETAIL SESI · {session.id}</span>
          <h1>{session.title}</h1>
          <p>
            {session.type} <span aria-hidden="true">·</span> Periode 2026—2027
          </p>
        </div>
        <span className={`${styles.status} ${styles[session.status]}`}>
          {session.status === "Aktif" ? (
            <span className={styles.activeDot} aria-hidden="true" />
          ) : session.status === "Ditutup" ? (
            <Check size={13} aria-hidden="true" />
          ) : (
            <Clock3 size={13} aria-hidden="true" />
          )}
          {session.status}
        </span>
      </header>

      <section className={styles.overview} aria-label="Informasi sesi">
        <div className={styles.overviewItem}>
          <CalendarDays size={16} aria-hidden="true" />
          <span>
            <small>Tanggal</small>
            <strong>{formatSessionDate(session.date)}</strong>
          </span>
        </div>
        <div className={styles.overviewItem}>
          <Clock3 size={16} aria-hidden="true" />
          <span>
            <small>Waktu mulai</small>
            <strong>{session.time} WIB</strong>
          </span>
        </div>
        <div className={styles.overviewItem}>
          <MapPin size={16} aria-hidden="true" />
          <span>
            <small>Lokasi</small>
            <strong>{session.location}</strong>
          </span>
        </div>
        <div className={styles.overviewItem}>
          <UsersRound size={16} aria-hidden="true" />
          <span>
            <small>Anggota aktif</small>
            <strong>{activeMembers.length} anggota</strong>
          </span>
        </div>
      </section>

      {session.notes && (
        <p className={styles.notes}>
          <strong>Catatan kegiatan</strong>
          {session.notes}
        </p>
      )}

      <section className={styles.summaryPanel} aria-labelledby="summary-title">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>REKAP KEHADIRAN</span>
            <h2 id="summary-title">Ringkasan sesi</h2>
          </div>
          <span className={styles.recordedCount}>
            {isDraft ? "Belum dimulai" : `${attendanceRecorded} tercatat`}
          </span>
        </div>

        {isDraft ? (
          <div className={styles.draftNotice}>
            Sesi ini masih berupa draft. Rekap akan tersedia setelah sesi dimulai.
          </div>
        ) : (
          <>
            <div className={styles.metrics}>
              <article className={styles.metric}>
                <span>Hadir</span>
                <strong>{counts.hadir}</strong>
              </article>
              <article className={styles.metric}>
                <span>Izin</span>
                <strong>{counts.izin}</strong>
              </article>
              <article className={styles.metric}>
                <span>Sakit</span>
                <strong>{counts.sakit}</strong>
              </article>
              {session.status === "Ditutup" && (
                <article className={styles.metric}>
                  <span>Alpha</span>
                  <strong>{counts.alpha}</strong>
                </article>
              )}
              {session.status === "Aktif" && (
                <article className={styles.metric}>
                  <span>Belum tercatat</span>
                  <strong>{counts.notRecorded}</strong>
                </article>
              )}
            </div>

            <div className={styles.progressSummary}>
              <div>
                <span>Hadir dari anggota aktif</span>
                <strong>
                  {counts.hadir} / {activeMembers.length}
                </strong>
              </div>
              <div
                className={styles.progressTrack}
                role="progressbar"
                aria-label="Persentase anggota hadir"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={attendanceProgress}
              >
                <span style={{ width: `${attendanceProgress}%` }} />
              </div>
            </div>
          </>
        )}
      </section>

      {!isDraft && (
        <section className={styles.rosterPanel} aria-labelledby="roster-title">
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>MONITORING ANGGOTA</span>
              <h2 id="roster-title">Daftar kehadiran</h2>
            </div>
            <span className={styles.recordedCount}>
              {attendanceRecorded} dari {activeMembers.length}
            </span>
          </div>
          <div className={styles.rosterTableWrap}>
            <table className={styles.rosterTable}>
              <thead>
                <tr>
                  <th scope="col">Anggota</th>
                  <th scope="col">Divisi</th>
                  <th scope="col">Status kehadiran</th>
                  <th scope="col">Metode</th>
                  <th scope="col">Waktu tercatat</th>
                </tr>
              </thead>
              <tbody>
                {activeMembers.map((member) => {
                  const entry = session.attendance.find(
                    (attendance) => attendance.memberId === member.id,
                  );

                  return (
                    <tr key={member.id}>
                      <td data-label="Anggota">
                        <span className={styles.member}>
                          <span className={styles.avatar} aria-hidden="true">
                            {member.name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")}
                          </span>
                          <span>
                            <strong>{member.name}</strong>
                            <small>{member.nim}</small>
                          </span>
                        </span>
                      </td>
                      <td data-label="Divisi">{member.division}</td>
                      <td data-label="Status kehadiran">
                        {entry ? (
                          <span
                            className={`${styles.attendanceStatus} ${statusClassNames[entry.status]}`}
                          >
                            {entry.status}
                          </span>
                        ) : (
                          <span
                            className={`${styles.attendanceStatus} ${styles.pending}`}
                          >
                            Belum tercatat
                          </span>
                        )}
                      </td>
                      <td data-label="Metode">{entry?.method ?? "—"}</td>
                      <td data-label="Waktu tercatat">{entry?.time ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className={styles.demoNote}>
        Informasi sesi ini merupakan data pratinjau lokal. Halaman Admin hanya
        untuk monitoring; pembukaan sesi dan pencatatan absensi dilakukan Operator.
      </p>
    </div>
  );
}
