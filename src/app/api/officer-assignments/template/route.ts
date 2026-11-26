import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { officerPositions } from "@/lib/page-access-config";
import { getDivisionNames } from "@/lib/division-service";
import { MAX_OFFICER_IMPORT_ROWS } from "@/lib/officer-assignment-import-constants";
import { initialAccountPassword } from "@/lib/account-credentials";

export async function GET() {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mengunduh template pengurus." },
      { status: access.status },
    );
  }

  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const divisions = await getDivisionNames();
  const referenceSheet = workbook.addWorksheet("Referensi");
  referenceSheet.state = "hidden";
  officerPositions.forEach((position, index) => {
    referenceSheet.getCell(index + 1, 1).value = position.label;
  });
  divisions.forEach((division, index) => {
    referenceSheet.getCell(index + 1, 2).value = division;
  });
  workbook.definedNames.add(
    `'Referensi'!$A$1:$A$${officerPositions.length}`,
    "DaftarJabatan",
  );
  if (divisions.length) {
    workbook.definedNames.add(
      `'Referensi'!$B$1:$B$${divisions.length}`,
      "DaftarDivisi",
    );
  }

  const worksheet = workbook.addWorksheet("Pengurus");
  worksheet.columns = [
    { header: "NIM", key: "nim", width: 20 },
    { header: "Nama", key: "name", width: 32 },
    { header: "Angkatan (opsional)", key: "cohort", width: 22 },
    { header: "Jabatan", key: "position", width: 24 },
    { header: "Divisi", key: "division", width: 28 },
  ];
  worksheet.getRow(1).font = { bold: true };
  worksheet.getColumn(1).numFmt = "@";
  worksheet.getColumn(3).numFmt = "@";
  for (let rowNumber = 2; rowNumber <= MAX_OFFICER_IMPORT_ROWS + 1; rowNumber += 1) {
    worksheet.getCell(rowNumber, 3).dataValidation = {
      type: "whole",
      operator: "between",
      allowBlank: true,
      formulae: [1900, 2100],
    };
    worksheet.getCell(rowNumber, 4).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ["=DaftarJabatan"],
    };
    if (divisions.length) {
      worksheet.getCell(rowNumber, 5).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ["=DaftarDivisi"],
      };
    }
  }

  const instructions = workbook.addWorksheet("Petunjuk");
  instructions.addRows([
    ["PANDUAN IMPOR SUSUNAN PENGURUS"],
    ["Isi satu penugasan jabatan per baris pada sheet Pengurus."],
    ["Kolom wajib: NIM, Nama, dan Jabatan. Angkatan boleh dikosongkan."],
    ["Divisi wajib untuk Ketua Divisi dan PJ Divisi. Kosongkan untuk jabatan lain."],
    ["Anggota baru akan didaftarkan pada periode aktif. Jika sudah ada, nama dan NIM harus cocok."],
    ["Anggota baru dengan jabatan divisi akan masuk ke divisi tersebut. Jabatan lain menggunakan keanggotaan Organisasi."],
    ["Jika akun belum ada, akun login baru akan dibuat otomatis. Akun nonaktif yang ditugaskan akan diaktifkan."],
    [`Password awal akun baru: ${initialAccountPassword}.`],
    ["Email akun baru dibuat berdasarkan nama, divisi keanggotaan, dan periode."],
    ["Humas dan Infokom dapat memiliki lebih dari satu pemegang jabatan."],
    ["Impor mendaftarkan anggota yang belum ada dan menambahkan penugasan baru. Data yang bentrok membatalkan seluruh impor."],
    [`Maksimal ${MAX_OFFICER_IMPORT_ROWS} baris penugasan per file.`],
  ]);
  instructions.getColumn(1).width = 110;
  instructions.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="template-pengurus-restex.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
