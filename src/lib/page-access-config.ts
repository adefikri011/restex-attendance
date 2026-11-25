import type { AppRoleId } from "@/components/auth/role-config";

export const pageAccessPages = [
  { key: "members", label: "Anggota", href: "/members", sensitive: true },
  { key: "attendance", label: "Absensi Anggota", href: "/attendance", sensitive: true },
  {
    key: "officer-attendance",
    label: "Absensi Pengurus",
    href: "/attendance/pengurus",
    sensitive: true,
  },
  {
    key: "lanyard-card",
    label: "Kartu Lanyard",
    href: "/lanyard-card",
    sensitive: true,
  },
  { key: "periods", label: "Periode", href: "/periods", sensitive: true },
  {
    key: "recruitment-settings",
    label: "Pengaturan Pendaftaran",
    href: "/recruitment",
    sensitive: true,
  },
  {
    key: "recruitment-applicants",
    label: "Pendaftar",
    href: "/recruitment/applicants",
    sensitive: true,
  },
  {
    key: "recruitment-meetings",
    label: "Jadwal Pertemuan",
    href: "/recruitment/meetings",
    sensitive: true,
  },
  { key: "reports", label: "Laporan", href: "/reports", sensitive: true },
  {
    key: "announcements",
    label: "Artikel dan Pengumuman",
    href: "/announcements/manage",
    sensitive: false,
  },
  { key: "audit-log", label: "Audit Log", href: "/audit-log", sensitive: true },
] as const;

export type PageAccessKey = (typeof pageAccessPages)[number]["key"];

export const accessManagedRoles: {
  id: AppRoleId;
  label: string;
}[] = [
  { id: "super-admin", label: "Super Admin" },
  { id: "admin", label: "Admin" },
  { id: "ketua-divisi", label: "Ketua Divisi" },
  { id: "pj-divisi", label: "PJ Divisi" },
  { id: "calon-anggota", label: "Calon Anggota" },
  { id: "anggota", label: "Anggota" },
];

export const officerPositions = [
  { key: "ketua-umum", label: "Ketua Umum", requiresDivision: false },
  { key: "wakil-ketua-umum", label: "Wakil Ketua Umum", requiresDivision: false },
  { key: "sekretaris", label: "Sekretaris", requiresDivision: false },
  { key: "bendahara", label: "Bendahara", requiresDivision: false },
  { key: "humas", label: "Humas", requiresDivision: false },
  { key: "infokom", label: "Infokom", requiresDivision: false },
  { key: "ketua-divisi", label: "Ketua Divisi", requiresDivision: true },
  { key: "pj-divisi", label: "PJ Divisi", requiresDivision: true },
] as const;

export type OfficerPositionKey = (typeof officerPositions)[number]["key"];

const roleDefaultPages: Record<Exclude<AppRoleId, "super-admin">, PageAccessKey[]> = {
  admin: [
    "members",
    "attendance",
    "officer-attendance",
    "lanyard-card",
    "periods",
    "recruitment-settings",
    "recruitment-applicants",
    "recruitment-meetings",
    "reports",
    "announcements",
    "audit-log",
  ],
  "ketua-divisi": ["attendance", "lanyard-card", "reports"],
  "pj-divisi": ["attendance", "lanyard-card"],
  "calon-anggota": [],
  anggota: [],
};

const positionDefaultPages: Record<OfficerPositionKey, PageAccessKey[]> = {
  "ketua-umum": ["officer-attendance"],
  "wakil-ketua-umum": [],
  sekretaris: [],
  bendahara: [],
  humas: ["announcements"],
  infokom: [],
  "ketua-divisi": ["attendance", "lanyard-card", "reports"],
  "pj-divisi": ["attendance", "lanyard-card"],
};

export function isPageAccessKey(value: string): value is PageAccessKey {
  return pageAccessPages.some((page) => page.key === value);
}

export function isOfficerPositionKey(value: string): value is OfficerPositionKey {
  return officerPositions.some((position) => position.key === value);
}

export function getDefaultRolePageAccess(
  role: AppRoleId,
  page: PageAccessKey,
) {
  if (role === "super-admin") return true;
  return roleDefaultPages[role].includes(page);
}

export function getDefaultPositionPageAccess(
  position: OfficerPositionKey,
  page: PageAccessKey,
) {
  return positionDefaultPages[position].includes(page);
}

export function getPageAccessForPath(pathname: string): PageAccessKey | undefined {
  return pageAccessPages
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]?.key;
}
