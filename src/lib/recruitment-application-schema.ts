import { z } from "zod";

const currentYear = Number(
  new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
  }).format(new Date()),
);

export function normalizeStudyProgramName(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFKC");
}

export const studyProgramNameSchema = z
  .string()
  .trim()
  .transform((value) => value.normalize("NFKC").replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, "Nama jurusan atau program studi minimal 2 karakter.")
      .max(160, "Nama jurusan atau program studi maksimal 160 karakter."),
  );

export const recruitmentApplicationFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama harus terdiri dari 2 sampai 160 karakter.")
    .max(160, "Nama maksimal 160 karakter."),
  nim: z
    .string()
    .trim()
    .regex(/^[\p{L}\p{N} .'-]{1,32}$/u, "NIM tidak valid."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email maksimal 254 karakter.")
    .email("Masukkan email yang valid."),
  program: studyProgramNameSchema,
  cohort: z
    .string()
    .regex(/^\d{4}$/, "Tahun angkatan harus terdiri dari 4 angka.")
    .refine(
      (value) => Number(value) >= 2000 && Number(value) <= currentYear + 1,
      `Tahun angkatan harus antara 2000 dan ${currentYear + 1}.`,
    ),
  motivation: z
    .string()
    .trim()
    .min(20, "Alasan memilih UKM RESTEX minimal 20 karakter.")
    .max(1000, "Alasan memilih UKM RESTEX maksimal 1000 karakter."),
  password: z
    .string()
    .min(12, "Kata sandi harus terdiri dari 12 sampai 128 karakter.")
    .max(128, "Kata sandi harus terdiri dari 12 sampai 128 karakter."),
});

export const recruitmentApplicationFormSchema =
  recruitmentApplicationFieldsSchema
    .extend({
      passwordConfirmation: z.string(),
    })
    .refine((value) => value.password === value.passwordConfirmation, {
      message: "Konfirmasi kata sandi belum sama.",
      path: ["passwordConfirmation"],
    });

export type NewRecruitmentApplication = z.infer<
  typeof recruitmentApplicationFieldsSchema
>;
