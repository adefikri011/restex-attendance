import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { initialAccountPassword } from "@/lib/account-credentials";

export async function GET() {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk mengunduh template." },
      { status: access.status },
    );
  }

  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Anggota");
  worksheet.columns = [
    { header: "Nama", key: "name", width: 30 },
    { header: "NIM", key: "nim", width: 20 },
    { header: "Divisi", key: "division", width: 28 },
    { header: "Angkatan", key: "cohort", width: 14 },
    { header: "Status", key: "status", width: 16 },
  ];
  worksheet.getRow(1).font = { bold: true };
  worksheet.getColumn(2).numFmt = "@";
  worksheet.getColumn(4).numFmt = "@";
  for (let rowNumber = 2; rowNumber <= 51; rowNumber += 1) {
    worksheet.getCell(rowNumber, 3).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Software Development,Network & Security,UI/UX Design,Research & Development"'],
    };
    worksheet.getCell(rowNumber, 5).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"Aktif,Cuti,Keluar,Alumni"'],
    };
  }

  const instructions = workbook.addWorksheet("Petunjuk");
  instructions.addRows([
    ["PANDUAN IMPOR ANGGOTA"],
    ["Isi satu anggota per baris pada sheet Anggota."],
    ["Kolom wajib: Nama, NIM, Divisi, dan Angkatan."],
    ["Status boleh dikosongkan; jika kosong akan dibuat Aktif."],
    ["Divisi: Software Development, Network & Security, UI/UX Design, Research & Development."],
    ["Maksimal 50 anggota per file. Jika ada satu baris tidak valid, seluruh impor dibatalkan."],
    ["Email akun dibuat otomatis dari nama, kode divisi, dan periode aktif."],
    [`Password awal semua akun anggota adalah ${initialAccountPassword}.`],
  ]);
  instructions.getColumn(1).width = 110;
  instructions.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-anggota-restex.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
