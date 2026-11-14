export const auditCategories = [
  "Keanggotaan",
  "Absensi",
  "Periode",
  "Akun & akses",
  "Identitas",
  "Pengaturan",
] as const;

export type AuditCategory = (typeof auditCategories)[number];
export type AuditRange = "7 hari" | "30 hari" | "Semua";

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  category: AuditCategory;
  action: string;
  target: string;
  targetType: string;
  summary: string;
  before?: string;
  after?: string;
  reason?: string;
};

export type AuditLogPageData = {
  events: AuditEvent[];
  totalCount: number;
  filteredCount: number;
  hasMore: boolean;
  nextOffset: number;
  metrics: {
    totalCount: number;
    recentCount: number;
    actorCount: number;
    categoryCount: number;
  };
};

export function getAuditCategoryClass(category: AuditCategory) {
  if (category === "Keanggotaan") return "membership";
  if (category === "Absensi") return "attendance";
  if (category === "Periode") return "period";
  if (category === "Identitas") return "identity";
  return "access";
}

export function formatAuditDate(timestamp: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));
}

export function formatAuditTime(timestamp: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(new Date(timestamp));
}
