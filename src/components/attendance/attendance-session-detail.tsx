"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  MapPin,
  Square,
  UsersRound,
} from "lucide-react";
import { UserAvatar } from "@/components/avatar/user-avatar";
import { AttendanceScanner } from "./attendance-scanner";
import {
  formatSessionDate,
  getActiveMembers,
  getSessionCounts,
  isAttendanceSession,
  type AttendanceMember,
  type AttendanceSession,
  type AttendanceStatus,
} from "./attendance-data";
import styles from "./attendance-session-detail.module.css";

type AttendanceSessionDetailProps = {
  session: AttendanceSession;
  members: AttendanceMember[];
  canManage: boolean;
  periodName: string;
};

const statusClassNames: Record<AttendanceStatus, string> = {
  Hadir: styles.present,
  Izin: styles.excused,
  Sakit: styles.sick,
  Alpha: styles.absent,
};

export function AttendanceSessionDetail({
  session: initialSession,
  members,
  canManage,
  periodName,
}: AttendanceSessionDetailProps) {
  const [session, setSession] = useState(initialSession);
  const [actionError, setActionError] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const sessionMembers = session.division
    ? members.filter((member) => member.division === session.division)
    : members;
  const activeMembers = getActiveMembers(sessionMembers);
  const counts = getSessionCounts(session, activeMembers.length);
  const isDraft = session.status === "Draft";
  const attendanceRecorded = session.attendance.length;
  const attendanceProgress = activeMembers.length
    ? Math.round((counts.hadir / activeMembers.length) * 100)
    : 0;

  async function closeSession() {
    setActionError("");
    setIsClosing(true);
    try {
      const response = await fetch(`/api/attendance/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        setActionError(
          typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
            ? result.error
            : "Sesi gagal ditutup.",
        );
        return;
      }
      if (
        typeof result !== "object" ||
        result === null ||
        !("session" in result) ||
        !isAttendanceSession(result.session) ||
        result.session.status !== "Ditutup"
      ) {
        throw new Error("Respons penutupan sesi tidak valid.");
      }
      setSession(result.session);
    } catch {
      setActionError("Layanan sesi tidak dapat dihubungi.");
    } finally {
      setIsClosing(false);
    }
  }

  function addScannedAttendance(memberCode: string, recordedBy: string) {
    setSession((current) => ({
      ...current,
      attendance: [
        ...current.attendance,
        {
          memberId: memberCode,
          status: "Hadir",
          method: "QR",
          recordedBy,
          time: new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Jakarta",
          }).format(new Date()),
        },
      ],
    }));
  }

  return (
    <div className={styles.page}>
      <Link href="/attendance" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden="true" />
        Kembali ke monitoring
      </Link>

      <header className={styles.heading}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>DETAIL SESI · {session.division ?? "ORGANISASI"}</span>
          <h1>{session.title}</h1>
          <p>
            {session.type} <span aria-hidden="true">·</span> Periode {periodName}
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

      {canManage && session.status === "Aktif" && (
        <div className={styles.sessionActions}>
          <p>
            Dibuka oleh <strong>{session.createdBy ?? "—"}</strong>. Operator setiap scan tercatat pada rekap.
          </p>
          <button
            type="button"
            className={styles.closeSessionButton}
            onClick={() => void closeSession()}
            disabled={isClosing}
          >
            <Square size={14} aria-hidden="true" />
            {isClosing ? "Menutup sesi..." : "Tutup sesi"}
          </button>
        </div>
      )}
      {actionError && <p className={styles.actionError} role="alert"><CircleAlert size={14} />{actionError}</p>}

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

      {canManage && session.status === "Aktif" && (
        <AttendanceScanner
          sessionId={session.id}
          onRecorded={({ memberCode, recordedBy }) =>
            addScannedAttendance(memberCode, recordedBy)
          }
        />
      )}

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
                  <th scope="col">Operator</th>
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
                          <UserAvatar
                            className={styles.avatar}
                            initials={member.name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join("")}
                            imageUrl={member.photoUrl}
                          />
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
                      <td data-label="Operator">{entry?.recordedBy ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <p className={styles.demoNote}>
        {canManage
          ? "Sesi dan kehadiran tersimpan pada database. Setiap scan mencatat waktu dan akun operator."
          : "Halaman ini hanya untuk monitoring; pembukaan sesi dan scan QR dilakukan Ketua Divisi atau PJ."}
      </p>
    </div>
  );
}
