export type PeriodStatus = "Aktif" | "Selesai" | "Akan datang";

export type PeriodRecord = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  memberCount: number;
  sessionCount: number;
  attendanceRate: number;
};

export const initialPeriods: PeriodRecord[] = [
  {
    id: "2026-2027",
    name: "2026 — 2027",
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    status: "Aktif",
    memberCount: 7,
    sessionCount: 4,
    attendanceRate: 88,
  },
  {
    id: "2025-2026",
    name: "2025 — 2026",
    startDate: "2025-07-01",
    endDate: "2026-06-30",
    status: "Selesai",
    memberCount: 34,
    sessionCount: 27,
    attendanceRate: 84,
  },
];

export function formatPeriodDateRange(startDate: string, endDate: string) {
  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const start = dateFormatter.format(new Date(`${startDate}T00:00:00`));
  const end = dateFormatter.format(new Date(`${endDate}T00:00:00`));

  return `${start} – ${end}`;
}

export function getPeriodName(startDate: string, endDate: string) {
  const startYear = new Date(`${startDate}T00:00:00`).getFullYear();
  const endYear = new Date(`${endDate}T00:00:00`).getFullYear();

  return `${startYear} — ${endYear}`;
}
