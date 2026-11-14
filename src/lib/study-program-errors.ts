export function isStudyProgramTableMissing(error: unknown) {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    error.code !== "P2021"
  ) {
    return false;
  }

  if (!("meta" in error) || typeof error.meta !== "object" || error.meta === null) {
    return false;
  }

  const metadata = error.meta;
  return (
    ("modelName" in metadata && metadata.modelName === "StudyProgram") ||
    ("table" in metadata &&
      typeof metadata.table === "string" &&
      metadata.table.includes("study_programs"))
  );
}

export const studyProgramMigrationMessage =
  "Tabel program studi belum tersedia. Jalankan `npx prisma migrate dev` di terminal proyek, lalu muat ulang halaman.";
