export const RECRUITMENT = {
  // Fallback awal sebelum pengaturan pertama disimpan dari dashboard admin.
  open: false,
  opensAt: undefined as string | undefined,
  closesAt: undefined as string | undefined,
  registerUrl: "/pendaftaran",
  notifyUrl: "",
  heading: "Ada tempat untuk namamu.",
  lead: "Bergabung dan kerjakan proyek teknologi bersama mahasiswa Nusa Putra lainnya.",
  // TODO: Isi setelah persyaratan resmi pendaftaran dikonfirmasi.
  requirements: [] as string[],
  // TODO: Isi setelah alur seleksi resmi dikonfirmasi.
  process: [] as { title: string; description?: string }[],
  // TODO: Isi setelah manfaat keanggotaan resmi dikonfirmasi.
  benefits: [] as string[],
};

export type RecruitmentStatus =
  | { state: "open"; daysLeft?: number; closesAt?: string }
  | { state: "upcoming"; opensAt?: string }
  | { state: "closed"; closesAt?: string };

export type RecruitmentSettings = Pick<
  typeof RECRUITMENT,
  "open" | "opensAt" | "closesAt" | "registerUrl" | "notifyUrl"
>;

function getJakartaDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function validateDate(date: string | undefined, fieldName: string) {
  if (date === undefined) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new RangeError(`${fieldName} must use YYYY-MM-DD format.`);
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new RangeError(`${fieldName} must be a valid calendar date.`);
  }

  return date;
}

function getCalendarDayNumber(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function getRecruitmentStatus(
  now = new Date(),
  settings: RecruitmentSettings = RECRUITMENT,
): RecruitmentStatus {
  const opensAt = validateDate(settings.opensAt, "opensAt");
  const closesAt = validateDate(settings.closesAt, "closesAt");
  const today = getJakartaDate(now);
  const isPastClosingDate =
    closesAt !== undefined && today > closesAt;

  if (settings.open) {
    if (isPastClosingDate) return { state: "closed", closesAt };

    return {
      state: "open",
      ...(closesAt
        ? {
            closesAt,
            daysLeft:
              getCalendarDayNumber(closesAt) - getCalendarDayNumber(today),
          }
        : {}),
    };
  }

  if (isPastClosingDate) return { state: "closed", closesAt };
  return { state: "upcoming", ...(opensAt ? { opensAt } : {}) };
}

export function formatTanggal(dateStr: string) {
  const date = validateDate(dateStr, "dateStr");
  if (!date) throw new RangeError("dateStr is required.");
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

// Future applications belong in a separate table with name, NIM, study
// program, cohort, chosen division, reason, and selection status. Accepted
// applicants can then become members in the attendance system.
