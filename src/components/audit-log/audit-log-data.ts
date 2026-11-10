export const auditCategories = [
  "Keanggotaan",
  "Absensi",
  "Periode",
  "Akun & akses",
  "Identitas",
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

export const sampleAuditEvents: AuditEvent[] = [
  {
    id: "AUD-2026-0110-009",
    timestamp: "2026-11-10T11:42:00+07:00",
    actor: "Fikri Ramadhan",
    actorRole: "Super Admin",
    category: "Keanggotaan",
    action: "Status keanggotaan diubah",
    target: "Salsabila Putri",
    targetType: "Anggota · RTX-2026-008",
    summary: "Status anggota diperbarui untuk periode berjalan.",
    before: "Aktif",
    after: "Cuti",
    reason: "Mengajukan cuti akademik.",
  },
  {
    id: "AUD-2026-0110-008",
    timestamp: "2026-11-10T10:18:00+07:00",
    actor: "Nadia Kurnia",
    actorRole: "Operator",
    category: "Absensi",
    action: "Kehadiran dicatat manual",
    target: "Rizky Aditya Pratama",
    targetType: "Anggota · RTX-2026-002",
    summary: "Kehadiran ditambahkan pada sesi Evaluasi Program Kerja.",
    after: "Hadir · SES-2026-009",
    reason: "QR anggota tidak dapat dipindai.",
  },
  {
    id: "AUD-2026-1109-007",
    timestamp: "2026-11-09T16:05:00+07:00",
    actor: "Fikri Ramadhan",
    actorRole: "Super Admin",
    category: "Periode",
    action: "Transisi status periode dijalankan",
    target: "Periode 2025 — 2026",
    targetType: "Periode kepengurusan",
    summary: "Status anggota periode sebelumnya ditinjau untuk proses demisioner.",
    before: "34 anggota aktif",
    after: "29 alumni · 5 dilanjutkan",
    reason: "Contoh pratinjau transisi akhir periode.",
  },
  {
    id: "AUD-2026-1109-006",
    timestamp: "2026-11-09T14:37:00+07:00",
    actor: "Fikri Ramadhan",
    actorRole: "Super Admin",
    category: "Akun & akses",
    action: "Role pengurus diperbarui",
    target: "Nadia Kurnia",
    targetType: "Akun pengurus · nadia.kurnia",
    summary: "Hak akses akun pengurus diubah.",
    before: "Admin",
    after: "Operator",
    reason: "Penyesuaian tanggung jawab operasional.",
  },
  {
    id: "AUD-2026-1108-005",
    timestamp: "2026-11-08T17:22:00+07:00",
    actor: "Fikri Ramadhan",
    actorRole: "Super Admin",
    category: "Identitas",
    action: "QR anggota dibuat ulang",
    target: "Aisyah Putri Ramadhani",
    targetType: "Anggota · RTX-2026-001",
    summary: "QR sebelumnya dinonaktifkan dan token identitas baru dibuat.",
    before: "QR lama · berakhir",
    after: "QR baru · aktif",
    reason: "Kartu identitas dilaporkan hilang.",
  },
  {
    id: "AUD-2026-1108-004",
    timestamp: "2026-11-08T18:10:00+07:00",
    actor: "Nadia Kurnia",
    actorRole: "Operator",
    category: "Absensi",
    action: "Sesi dibuka kembali",
    target: "Evaluasi Program Kerja",
    targetType: "Sesi absensi · SES-2026-009",
    summary: "Sesi yang sebelumnya ditutup dibuka kembali untuk koreksi data.",
    before: "Ditutup",
    after: "Aktif",
    reason: "Koreksi catatan absensi manual.",
  },
  {
    id: "AUD-2026-1107-003",
    timestamp: "2026-11-07T09:30:00+07:00",
    actor: "Fikri Ramadhan",
    actorRole: "Super Admin",
    category: "Periode",
    action: "Periode kepengurusan dibuat",
    target: "2027 — 2028",
    targetType: "Periode kepengurusan",
    summary: "Periode baru disiapkan sebagai rencana dan belum diaktifkan.",
    after: "Akan datang",
    reason: "Persiapan pergantian kepengurusan.",
  },
  {
    id: "AUD-2026-1106-002",
    timestamp: "2026-11-06T15:44:00+07:00",
    actor: "Nadia Kurnia",
    actorRole: "Operator",
    category: "Keanggotaan",
    action: "Anggota ditambahkan",
    target: "Rafi Pratama",
    targetType: "Anggota · RTX-2026-009",
    summary: "Data anggota baru ditambahkan ke periode aktif.",
    after: "Aktif · 2026 — 2027",
  },
  {
    id: "AUD-2026-1104-001",
    timestamp: "2026-11-04T20:12:00+07:00",
    actor: "Nadia Kurnia",
    actorRole: "Operator",
    category: "Absensi",
    action: "Kehadiran dicatat manual",
    target: "Putri Maharani",
    targetType: "Anggota · RTX-2026-005",
    summary: "Kehadiran ditambahkan pada sesi Rapat Koordinasi.",
    after: "Hadir · SES-2026-007",
    reason: "Kamera perangkat tidak tersedia.",
  },
];

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
