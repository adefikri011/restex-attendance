export const appRoles = [
  {
    id: "super-admin",
    label: "Super Admin",
    dashboardPath: "/dashboard/super-admin",
    databaseRole: "SUPER_ADMIN",
    description:
      "Akses penuh untuk mengelola akun, anggota, periode, sesi, dan laporan organisasi.",
    displayName: "Super Admin",
    homeTitle: "Kendali penuh, satu ruang kerja.",
    homeDescription:
      "Pantau administrasi RESTEX dan kelola seluruh kebutuhan organisasi dari satu tempat.",
  },
  {
    id: "admin",
    label: "Admin",
    dashboardPath: "/dashboard/admin",
    databaseRole: "ADMIN",
    description:
      "Menjalankan tugas sekretariat: mengelola administrasi anggota serta memantau laporan dan aktivitas organisasi.",
    displayName: "Admin",
    homeTitle: "Administrasi organisasi yang tertata.",
    homeDescription:
      "Kelola data keanggotaan, tinjau periode, dan siapkan laporan RESTEX.",
  },
  {
    id: "ketua-divisi",
    label: "Ketua Divisi",
    dashboardPath: "/dashboard/ketua-divisi",
    databaseRole: "DIVISION_LEAD",
    description:
      "Membuka sesi, mencatat absensi, dan memantau kehadiran divisi yang menjadi tanggung jawab.",
    displayName: "Ketua Divisi",
    homeTitle: "Aktivitas divisi, terpantau rapi.",
    homeDescription:
      "Buka sesi kegiatan, scan QR anggota, dan tinjau rekap kehadiran divisi.",
  },
  {
    id: "pj-divisi",
    label: "PJ Divisi",
    dashboardPath: "/dashboard/pj-divisi",
    databaseRole: "DIVISION_PJ",
    description:
      "Mendampingi Ketua Divisi dan menjalankan sesi serta absensi pada divisi yang ditugaskan.",
    displayName: "PJ Divisi",
    homeTitle: "Dukungan absensi untuk divisi.",
    homeDescription:
      "Buka sesi dan catat kehadiran anggota pada divisi yang menjadi tanggung jawabmu.",
  },
  {
    id: "anggota",
    label: "Anggota",
    dashboardPath: "/portal/anggota",
    databaseRole: "MEMBER",
    description:
      "Melihat profil, status keanggotaan, dan riwayat absensi pribadi.",
    displayName: "Anggota",
    homeTitle: "Perjalanan RESTEX milikmu.",
    homeDescription:
      "Lihat profil keanggotaan dan pantau riwayat kehadiranmu.",
  },
] as const;

export type AppRoleId = (typeof appRoles)[number]["id"];

export function getAppRole(roleId: string) {
  return appRoles.find((role) => role.id === roleId);
}

export function getAppRoleByDatabaseRole(roleId: string) {
  return appRoles.find((role) => role.databaseRole === roleId);
}
