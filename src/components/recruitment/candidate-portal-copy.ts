import type { ApplicantDecision, ApplicantStage } from "@/generated/prisma/client";

// TODO: Konfirmasikan redaksi status dan kartu anggota ini kepada pengurus.
export const candidatePortalCopy = {
  pageTitle: "Halo,",
  pageLead: "Ini perkembangan seleksimu.",
  role: "Calon anggota",
  acceptedRole: "Diterima",
  accountMenu: "Menu akun",
  signOut: "Keluar",
  signingOut: "Keluar...",
  signOutError: "Tidak dapat keluar. Silakan coba kembali.",
  signOutUnavailable: "Layanan akun tidak dapat dihubungi.",
  selectionProgress: "Tahap",
  of: "dari",
  nextStage: "Berikutnya:",
  lastUpdated: "Terakhir diperbarui",
  timePrefix: "pukul",
  timezone: "WIB",
  publishedResult: "Pengumuman sudah diterbitkan.",
  openAnnouncement: "Buka pengumuman",
  resultHeading: "Hasil seleksi",
  retry: "Muat ulang",
  emptyStatus: "Belum ada pendaftaran yang terhubung dengan akunmu.",
  loadError: "Progres seleksi belum bisa dimuat.",
  currentStageSr: "Tahap saat ini",
  completeStageSr: "Selesai",
  futureStageSr: "Belum dimulai",
  qrPending: "QR aktif setelah kamu resmi menjadi anggota.",
  qrAccepted: "Kartu anggotamu akan disiapkan pengurus.",
  stages: [
    {
      id: "SUBMITTED",
      title: "Pendaftaran",
    },
    {
      id: "SCREENING",
      title: "Screening",
      description: "Pendaftaranmu sudah diterima dan saat ini dalam proses screening oleh tim RESTEX.",
      timelineDescription: "Tim RESTEX sedang meninjau pendaftaranmu.",
    },
    {
      id: "MEETING_INVITED",
      title: "Pertemuan",
      description: "Kamu diundang mengikuti pertemuan seleksi. Pilih sesi yang tersedia.",
      timelineDescription: "Pilih jadwal tatap muka atau Zoom jika opsi tersebut tersedia.",
    },
    {
      id: "FORM_TWO_OPEN",
      title: "Formulir lanjutan",
    },
    {
      id: "FORM_TWO_SUBMITTED",
      title: "Formulir terkirim",
    },
    {
      id: "FINAL_REVIEW",
      title: "Tinjauan akhir",
    },
    {
      id: "ANNOUNCEMENT",
      title: "Pengumuman",
    },
  ] as const,
  result: {
    ACCEPTED: {
      title: "Selamat, kamu diterima di RESTEX.",
      message: "",
    },
    REJECTED: {
      title: "Terima kasih sudah mendaftar.",
      message: "Kali ini kamu belum lolos seleksi.",
    },
    WAITLISTED: {
      title: "Hasil seleksi sudah ditetapkan.",
      message: "Keputusan panitia untuk pendaftaranmu adalah daftar tunggu.",
    },
  } satisfies Record<ApplicantDecision, { title: string; message: string }>,
} as const;

export function getCandidateStageIndex(stage: ApplicantStage) {
  if (stage === "SUBMITTED" || stage === "SCREENING") return 1;
  return candidatePortalCopy.stages.findIndex((item) => item.id === stage);
}
