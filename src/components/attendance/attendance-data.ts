import type { Member } from "@/components/members/member-data";

export const activityTypes = [
  "Rutin",
  "Workshop",
  "Seminar",
  "Internal",
  "Lainnya",
] as const;

export type ActivityType = (typeof activityTypes)[number];
export type SessionStatus = "Aktif" | "Draft" | "Ditutup";
export type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpha";
export type AttendanceMethod = "QR" | "Manual";
export type AttendanceMember = Pick<
  Member,
  "id" | "name" | "nim" | "division" | "status" | "photoUrl"
>;

export type AttendanceEntry = {
  memberId: string;
  status: AttendanceStatus;
  method?: AttendanceMethod;
  reason?: string;
  time?: string;
  recordedBy?: string;
};

export type AttendanceSession = {
  id: string;
  title: string;
  type: ActivityType;
  date: string;
  time: string;
  location: string;
  notes: string;
  status: SessionStatus;
  division?: string | null;
  createdBy?: string;
  attendance: AttendanceEntry[];
};

export type NewSessionInput = Pick<
  AttendanceSession,
  "title" | "type" | "date" | "time" | "location" | "notes"
>;

export function isAttendanceSession(value: unknown): value is AttendanceSession {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("id" in value) ||
    typeof value.id !== "string" ||
    !("title" in value) ||
    typeof value.title !== "string" ||
    !("type" in value) ||
    typeof value.type !== "string" ||
    !activityTypes.some((item) => item === value.type) ||
    !("date" in value) ||
    typeof value.date !== "string" ||
    !("time" in value) ||
    typeof value.time !== "string" ||
    !("location" in value) ||
    typeof value.location !== "string" ||
    !("notes" in value) ||
    typeof value.notes !== "string" ||
    !("status" in value) ||
    (value.status !== "Draft" && value.status !== "Aktif" && value.status !== "Ditutup") ||
    !("attendance" in value) ||
    !Array.isArray(value.attendance)
  ) {
    return false;
  }
  return value.attendance.every(
    (entry) =>
      typeof entry === "object" &&
      entry !== null &&
      "memberId" in entry &&
      typeof entry.memberId === "string" &&
      "status" in entry &&
      (entry.status === "Hadir" ||
        entry.status === "Izin" ||
        entry.status === "Sakit" ||
        entry.status === "Alpha"),
  );
}

export function getActiveMembers<T extends AttendanceMember>(members: T[]) {
  return members.filter((member) => member.status === "Aktif");
}

export function getSessionCounts(session: AttendanceSession, totalActive: number) {
  const counts = {
    hadir: session.attendance.filter((entry) => entry.status === "Hadir").length,
    izin: session.attendance.filter((entry) => entry.status === "Izin").length,
    sakit: session.attendance.filter((entry) => entry.status === "Sakit").length,
    alpha: session.attendance.filter((entry) => entry.status === "Alpha").length,
  };

  return {
    ...counts,
    totalActive,
    notRecorded: Math.max(0, totalActive - counts.hadir - counts.izin - counts.sakit - counts.alpha),
  };
}

export function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function createInitialSessions(members: Member[]): AttendanceSession[] {
  const active = getActiveMembers(members);

  return [
    {
      id: "SES-2026-011",
      title: "Rapat Rutin Mingguan",
      type: "Rutin",
      date: "2026-11-10",
      time: "19:00",
      location: "Ruang Kreatif RESTEX",
      notes: "Evaluasi agenda dan pembagian tugas mingguan.",
      status: "Aktif",
      attendance: active.slice(0, 5).map((member, index) => ({
        memberId: member.id,
        status: "Hadir",
        method: "QR",
        time: `19:${String(index * 4 + 3).padStart(2, "0")}`,
      })),
    },
    {
      id: "SES-2026-010",
      title: "Workshop UI/UX Dasar",
      type: "Workshop",
      date: "2026-11-14",
      time: "13:00",
      location: "Lab Komputer 2",
      notes: "Sesi pengenalan prinsip desain antarmuka.",
      status: "Draft",
      attendance: [],
    },
    {
      id: "SES-2026-009",
      title: "Evaluasi Program Kerja",
      type: "Internal",
      date: "2026-11-08",
      time: "16:00",
      location: "Sekretariat RESTEX",
      notes: "Evaluasi progres program kerja bulan berjalan.",
      status: "Ditutup",
      attendance: active.map((member, index) => ({
        memberId: member.id,
        status: index === active.length - 1 ? "Alpha" : "Hadir",
        method: index === 1 ? "Manual" : "QR",
        reason: index === 1 ? "QR rusak" : undefined,
        time: index < active.length - 1 ? `16:${String(index * 5 + 2).padStart(2, "0")}` : undefined,
      })),
    },
    {
      id: "SES-2026-008",
      title: "Kelas Dasar Keamanan Jaringan",
      type: "Seminar",
      date: "2026-11-05",
      time: "09:00",
      location: "Aula Kampus",
      notes: "",
      status: "Ditutup",
      attendance: active.map((member, index) => ({
        memberId: member.id,
        status: index < active.length - 2 ? "Hadir" : index === active.length - 2 ? "Izin" : "Alpha",
        method: index < active.length - 2 ? "QR" : undefined,
        time: index < active.length - 2 ? `09:${String(index * 6 + 4).padStart(2, "0")}` : undefined,
      })),
    },
  ];
}
