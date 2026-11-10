import {
  getSessionCounts,
  type AttendanceSession,
  type AttendanceStatus,
} from "@/components/attendance/attendance-data";
import type { Member } from "@/components/members/member-data";

export type ReportRange = "Bulan ini" | "Semester I" | "Seluruh periode";

export type MemberAttendanceSummary = {
  member: Member;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  attendanceRate: number;
};

export function filterSessionsByRange(
  sessions: AttendanceSession[],
  range: ReportRange,
) {
  return sessions.filter((session) => {
    if (range === "Bulan ini") return session.date.startsWith("2026-11");
    if (range === "Semester I") return session.date >= "2026-07-01" && session.date <= "2026-12-31";
    return session.date >= "2026-07-01" && session.date <= "2027-06-30";
  });
}

export function summarizeSessions(sessions: AttendanceSession[], totalActive: number) {
  const completedSessions = sessions.filter((session) => session.status === "Ditutup");
  const totals: Record<AttendanceStatus, number> = {
    Hadir: 0,
    Izin: 0,
    Sakit: 0,
    Alpha: 0,
  };

  for (const session of completedSessions) {
    const counts = getSessionCounts(session, totalActive);
    totals.Hadir += counts.hadir;
    totals.Izin += counts.izin;
    totals.Sakit += counts.sakit;
    totals.Alpha += counts.alpha;
  }

  const possibleAttendance = completedSessions.length * totalActive;

  return {
    completedSessions,
    totals,
    totalSessions: sessions.length,
    activeSessions: sessions.filter((session) => session.status === "Aktif").length,
    draftSessions: sessions.filter((session) => session.status === "Draft").length,
    completedCount: completedSessions.length,
    averageAttendance: possibleAttendance
      ? Math.round((totals.Hadir / possibleAttendance) * 100)
      : 0,
    attendanceRecords: possibleAttendance,
  };
}

export function summarizeMembers(
  members: Member[],
  completedSessions: AttendanceSession[],
): MemberAttendanceSummary[] {
  return members
    .filter((member) => member.status === "Aktif")
    .map((member) => {
      const attendance = {
        Hadir: 0,
        Izin: 0,
        Sakit: 0,
        Alpha: 0,
      };

      for (const session of completedSessions) {
        const entry = session.attendance.find(
          (attendanceEntry) => attendanceEntry.memberId === member.id,
        );
        if (entry) attendance[entry.status] += 1;
      }

      return {
        member,
        hadir: attendance.Hadir,
        izin: attendance.Izin,
        sakit: attendance.Sakit,
        alpha: attendance.Alpha,
        attendanceRate: completedSessions.length
          ? Math.round((attendance.Hadir / completedSessions.length) * 100)
          : 0,
      };
    })
    .sort(
      (first, second) =>
        second.attendanceRate - first.attendanceRate ||
        first.member.name.localeCompare(second.member.name, "id"),
    );
}
