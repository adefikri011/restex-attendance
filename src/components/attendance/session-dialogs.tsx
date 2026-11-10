"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, Clock3, MapPin, X } from "lucide-react";
import type { Member } from "@/components/members/member-data";
import { MemberDialog } from "@/components/members/member-dialog";
import styles from "./attendance.module.css";
import type {
  AttendanceSession,
  NewSessionInput,
} from "./attendance-data";
import { activityTypes } from "./attendance-data";

type CreateSessionDialogProps = {
  onClose: () => void;
  onSubmit: (input: NewSessionInput) => void;
};

function getLocalDate() {
  const now = new Date();
  const localOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - localOffset).toISOString().slice(0, 10);
}

export function CreateSessionDialog({
  onClose,
  onSubmit,
}: CreateSessionDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<(typeof activityTypes)[number]>("Rutin");
  const [date, setDate] = useState(getLocalDate);
  const [time, setTime] = useState("19:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      title: title.trim(),
      type,
      date,
      time,
      location: location.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <MemberDialog
      labelledBy="create-session-title"
      onClose={onClose}
      className={styles.sessionDialog}
    >
      <div className={styles.dialogHeading}>
        <div>
          <span className={styles.dialogEyebrow}>PERIODE AKTIF · 2026—2027</span>
          <h2 id="create-session-title">Buat sesi absensi</h2>
          <p>Lengkapi detail kegiatan. Sesi baru akan disimpan sebagai draft.</p>
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

      <form className={styles.sessionForm} onSubmit={handleSubmit}>
        <label>
          Nama sesi
          <input
            data-autofocus
            required
            maxLength={80}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contoh: Rapat Rutin Mingguan"
          />
        </label>

        <div className={styles.formRow}>
          <label>
            Jenis kegiatan
            <select
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
            >
              {activityTypes.map((activityType) => (
                <option key={activityType}>{activityType}</option>
              ))}
            </select>
          </label>
          <label>
            Lokasi
            <input
              required
              maxLength={80}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Contoh: Ruang Kreatif"
            />
          </label>
        </div>

        <div className={styles.formRow}>
          <label>
            Tanggal
            <span className={styles.inputWithIcon}>
              <CalendarDays size={15} aria-hidden="true" />
              <input
                required
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </span>
          </label>
          <label>
            Waktu mulai
            <span className={styles.inputWithIcon}>
              <Clock3 size={15} aria-hidden="true" />
              <input
                required
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </span>
          </label>
        </div>

        <label>
          Catatan <span className={styles.optionalLabel}>Opsional</span>
          <textarea
            rows={3}
            maxLength={240}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Tambahkan agenda singkat untuk pengurus."
          />
        </label>

        <p className={styles.dialogNote}>
          Membuat sesi hanya menyimpan draft lokal. Sesi belum dapat dipindai sebelum
          dimulai.
        </p>
        <div className={styles.dialogActions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Batal
          </button>
          <button type="submit" className={styles.submitButton}>
            Simpan sebagai draft
          </button>
        </div>
      </form>
    </MemberDialog>
  );
}

type SessionDetailDialogProps = {
  session: AttendanceSession;
  members: Member[];
  onClose: () => void;
  canStart: boolean;
  onStart: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
  onManualAttendance: (sessionId: string, memberId: string, reason: string) => void;
};

export function SessionDetailDialog({
  session,
  members,
  onClose,
  canStart,
  onStart,
  onCloseSession,
  onManualAttendance,
}: SessionDetailDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [reason, setReason] = useState("Lupa membawa lanyard");
  const [showManualForm, setShowManualForm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const activeMembers = members.filter((member) => member.status === "Aktif");
  const recordedMemberIds = new Set(
    session.attendance.map((entry) => entry.memberId),
  );
  const unrecordedMembers = activeMembers.filter(
    (member) => !recordedMemberIds.has(member.id),
  );
  const presentCount = session.attendance.filter(
    (entry) => entry.status === "Hadir",
  ).length;
  const progress = activeMembers.length
    ? Math.round((presentCount / activeMembers.length) * 100)
    : 0;

  function handleManualAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMemberId) return;
    onManualAttendance(session.id, selectedMemberId, reason);
    setSelectedMemberId("");
    setShowManualForm(false);
  }

  const statusStyles = {
    Hadir: styles.attendancePresent,
    Izin: styles.attendanceExcused,
    Sakit: styles.attendanceSick,
    Alpha: styles.attendanceAbsent,
  };

  return (
    <MemberDialog
      labelledBy="session-detail-title"
      onClose={onClose}
      className={styles.detailDialog}
    >
      <div className={styles.dialogHeading}>
        <div>
          <span className={styles.dialogEyebrow}>
            DETAIL SESI · {session.id}
          </span>
          <h2 id="session-detail-title">{session.title}</h2>
          <p>{session.type} · Periode 2026—2027</p>
        </div>
        <button
          type="button"
          className={styles.dialogClose}
          onClick={onClose}
          aria-label="Tutup detail sesi"
        >
          <X size={19} />
        </button>
      </div>

      <div className={styles.detailMeta}>
        <span><CalendarDays size={15} aria-hidden="true" />{session.date}</span>
        <span><Clock3 size={15} aria-hidden="true" />{session.time}</span>
        <span><MapPin size={15} aria-hidden="true" />{session.location}</span>
      </div>

      <div className={styles.detailProgress}>
        <div className={styles.detailProgressHeader}>
          <span>Kehadiran tercatat</span>
          <strong>{presentCount}<small> / {activeMembers.length}</small></strong>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label="Persentase kehadiran"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.rosterHeader}>
        <div>
          <h3>Daftar anggota aktif</h3>
          <p>Anggota nonaktif tidak dihitung dalam sesi.</p>
        </div>
        {session.status === "Aktif" && unrecordedMembers.length > 0 && (
          <button
            type="button"
            className={styles.manualButton}
            onClick={() => setShowManualForm((current) => !current)}
          >
            Catat manual
          </button>
        )}
      </div>

      {showManualForm && (
        <form className={styles.manualForm} onSubmit={handleManualAttendance}>
          <label>
            Pilih anggota
            <select
              required
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
            >
              <option value="">Pilih anggota yang hadir</option>
              {unrecordedMembers.map((member) => (
                <option value={member.id} key={member.id}>
                  {member.name} · {member.nim}
                </option>
              ))}
            </select>
          </label>
          <label>
            Alasan pencatatan manual
            <select
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              <option>Lupa membawa lanyard</option>
              <option>QR rusak</option>
              <option>Lainnya</option>
            </select>
          </label>
          <div className={styles.manualActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setShowManualForm(false)}
            >
              Batal
            </button>
            <button type="submit" className={styles.submitButton}>
              Simpan kehadiran
            </button>
          </div>
        </form>
      )}

      <div className={styles.rosterList}>
        {activeMembers.map((member) => {
          const entry = session.attendance.find(
            (item) => item.memberId === member.id,
          );
          const label = entry?.status ?? (
            session.status === "Ditutup" ? "Alpha" : "Belum hadir"
          );

          return (
            <div className={styles.rosterRow} key={member.id}>
              <span className={styles.memberAvatar}>
                {member.name
                  .split(" ")
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </span>
              <span className={styles.memberDetails}>
                <strong>{member.name}</strong>
                <small>{member.division}</small>
              </span>
              <span
                className={`${styles.attendanceBadge} ${
                  entry ? statusStyles[entry.status] : styles.attendancePending
                }`}
              >
                {label}
              </span>
              {entry?.method === "Manual" && (
                <small className={styles.methodLabel}>Manual</small>
              )}
            </div>
          );
        })}
      </div>

      {session.notes && (
        <p className={styles.sessionNotes}>{session.notes}</p>
      )}

      {session.status === "Draft" && (
        <div className={styles.detailActions}>
          <button
            type="button"
            className={styles.submitButton}
            disabled={!canStart}
            onClick={() => onStart(session.id)}
          >
            Mulai sesi
          </button>
          {!canStart && (
            <p className={styles.startBlocked}>
              Tutup sesi aktif lainnya sebelum memulai sesi ini.
            </p>
          )}
        </div>
      )}
      {session.status === "Aktif" && (
        <div className={styles.detailActions}>
          <button
            type="button"
            className={styles.closeSessionButton}
            onClick={() => setShowCloseConfirm(true)}
          >
            Tutup sesi
          </button>
        </div>
      )}

      {showCloseConfirm && (
        <div className={styles.confirmPanel} role="alertdialog" aria-modal="true" aria-labelledby="close-session-title">
          <div>
            <span className={styles.dialogEyebrow}>KONFIRMASI</span>
            <h3 id="close-session-title">Tutup sesi ini?</h3>
            <p>
              {unrecordedMembers.length} anggota aktif yang belum tercatat akan
              ditandai Alpha pada pratinjau ini.
            </p>
          </div>
          <div className={styles.manualActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => setShowCloseConfirm(false)}
            >
              Kembali
            </button>
            <button
              type="button"
              className={styles.closeSessionButton}
              onClick={() => onCloseSession(session.id)}
            >
              Ya, tutup sesi
            </button>
          </div>
        </div>
      )}
    </MemberDialog>
  );
}
