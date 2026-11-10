export type AttendanceDay = {
  label: string;
  percentage: number;
};

export type SessionStatus = "Selesai" | "Aktif" | "Draft";

export type RecentSession = {
  name: string;
  type: string;
  date: string;
  attendance: string;
  status: SessionStatus;
};

export const attendanceByMonth: AttendanceDay[] = [
  { label: "Jun", percentage: 76 },
  { label: "Jul", percentage: 82 },
  { label: "Agu", percentage: 71 },
  { label: "Sep", percentage: 88 },
  { label: "Okt", percentage: 84 },
  { label: "Nov", percentage: 91 },
];

export const recentSessions: RecentSession[] = [
  {
    name: "Rapat Rutin Mingguan",
    type: "Rutin",
    date: "08 Nov 2026",
    attendance: "38 / 42",
    status: "Selesai",
  },
  {
    name: "Workshop UI/UX Dasar",
    type: "Workshop",
    date: "05 Nov 2026",
    attendance: "35 / 42",
    status: "Selesai",
  },
  {
    name: "Evaluasi Program Kerja",
    type: "Internal",
    date: "12 Nov 2026",
    attendance: "—",
    status: "Draft",
  },
];
