export type PeriodStatus = "Aktif" | "Selesai" | "Akan datang";

export type PeriodRecord = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  memberCount: number;
  activeMemberCount: number;
  sessionCount: number;
  attendanceRate: number;
};

export function formatPeriodDateRange(startDate: string, endDate: string) {
  const dateFormatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const start = dateFormatter.format(new Date(`${startDate}T12:00:00`));
  const end = dateFormatter.format(new Date(`${endDate}T12:00:00`));

  return `${start} – ${end}`;
}

export function getDefaultPeriodEndDate(startDate: string) {
  const endDate = new Date(`${startDate}T00:00:00.000Z`);
  endDate.setUTCFullYear(endDate.getUTCFullYear() + 1);
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  return endDate.toISOString().slice(0, 10);
}

export function getPeriodName(startDate: string, endDate: string) {
  const startYear = startDate.slice(0, 4);
  const endYear = endDate.slice(0, 4);
  return `${startYear} — ${endYear}`;
}
