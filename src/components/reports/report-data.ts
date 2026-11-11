import {
  getSessionCounts,
  type AttendanceSession,
  type AttendanceStatus,
} from "@/components/attendance/attendance-data";
import type { Member } from "@/components/members/member-data";

export type ReportRange = "Bulan ini" | "Semester I" | "Seluruh periode";

export type ReportPeriodOption = {
  id: string;
  name: string;
  label: string;
  startDate: string;
  endDate: string;
};

export type ReportPageData = {
  periods: ReportPeriodOption[];
  selectedPeriodId: string;
  sessions: AttendanceSession[];
  members: Member[];
};

export type MemberAttendanceSummary = {
  member: Member;
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  attendanceRate: number;
};

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

  const possibleAttendance = completedSessions.reduce(
    (total, session) => total + (session.eligibleMemberCount ?? totalActive),
    0,
  );

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
      const eligibleSessions = completedSessions.filter(
        (session) => !session.division || session.division === member.division,
      );

      for (const session of eligibleSessions) {
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
        attendanceRate: eligibleSessions.length
          ? Math.round((attendance.Hadir / eligibleSessions.length) * 100)
          : 0,
      };
    })
    .sort(
      (first, second) =>
        second.attendanceRate - first.attendanceRate ||
        first.member.name.localeCompare(second.member.name, "id"),
    );
}
