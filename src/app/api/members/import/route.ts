import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import { getDivisionNames } from "@/lib/division-service";
import { validateMemberInput } from "@/lib/member-input";
import { createMembers, type NewMemberInput } from "@/lib/member-service";

const maxFileSize = 2 * 1024 * 1024;
const maxImportedRows = 50;

type ImportIssue = { row: number; message: string };

function normalizeHeader(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cellText(row: import("exceljs").Row, column: number | undefined) {
  return column ? row.getCell(column).text.trim() : "";
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin", "admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Anda tidak memiliki izin untuk mengimpor anggota." },
      { status: access.status },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxFileSize + 64_000) {
    return NextResponse.json(
      { error: "Ukuran file maksimal 2 MB." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format unggahan tidak valid." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Pilih file Excel (.xlsx) terlebih dahulu." },
      { status: 400 },
    );
  }
  if (file.size > maxFileSize) {
    return NextResponse.json(
      { error: "Ukuran file maksimal 2 MB." },
      { status: 413 },
    );
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json(
      { error: "Format yang didukung hanya file Excel .xlsx." },
      { status: 415 },
    );
  }

  let workbook: import("exceljs").Workbook;
  try {
    const { Workbook } = await import("exceljs");
    workbook = new Workbook();
    await workbook.xlsx.read(
      Readable.from([Buffer.from(await file.arrayBuffer())]),
    );
  } catch {
    return NextResponse.json(
      { error: "File Excel rusak atau tidak dapat dibaca." },
      { status: 400 },
    );
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) {
    return NextResponse.json(
      { error: "File Excel belum memiliki baris data." },
      { status: 400 },
    );
  }
  if (worksheet.rowCount > maxImportedRows + 1) {
    return NextResponse.json(
      { error: `Maksimal ${maxImportedRows} anggota per file.` },
      { status: 413 },
    );
  }

  const headers = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, column) => {
    const key = normalizeHeader(cell.text);
    if (key) headers.set(key, column);
  });

  const columnAliases: Record<string, string[]> = {
    name: ["nama", "namalengkap", "name", "fullname"],
    nim: ["nim", "nomorindukmahasiswa"],
    division: ["divisi", "division"],
    cohort: ["angkatan", "cohort", "tahunangkatan"],
    status: ["status", "statuskeanggotaan"],
  };
  function getColumn(aliases: string[]) {
    return aliases.map((alias) => headers.get(alias)).find((column) => column !== undefined);
  }

  const columns = {
    name: getColumn(columnAliases.name),
    nim: getColumn(columnAliases.nim),
    division: getColumn(columnAliases.division),
    cohort: getColumn(columnAliases.cohort),
    status: getColumn(columnAliases.status),
  };

  const missingHeaders = (["name", "nim", "division", "cohort"] as const)
    .filter((field) => !columns[field])
    .map((field) => {
      if (field === "name") return "Nama";
      if (field === "nim") return "NIM";
      if (field === "division") return "Divisi";
      return "Angkatan";
    });
  if (missingHeaders.length > 0) {
    return NextResponse.json(
      { error: `Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}.` },
      { status: 400 },
    );
  }

  const inputs: { row: number; input: NewMemberInput }[] = [];
  const issues: ImportIssue[] = [];
  const divisions = await getDivisionNames();
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const rawStatus = cellText(row, columns.status);
    const raw = {
      name: cellText(row, columns.name),
      nim: cellText(row, columns.nim),
      division: cellText(row, columns.division),
      cohort: cellText(row, columns.cohort),
      status: rawStatus,
    };
    if (Object.values(raw).every((value) => !value)) continue;
    if (!raw.status) raw.status = "Aktif";

    const validation = validateMemberInput(raw, divisions);
    if (validation.input === null) {
      if (validation.error) {
        issues.push({ row: rowNumber, message: validation.error });
      }
    } else {
      inputs.push({ row: rowNumber, input: validation.input });
    }
  }

  if (inputs.length === 0 && issues.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada data anggota untuk diimpor." },
      { status: 400 },
    );
  }

  const seenNims = new Set<string>();
  for (const { row, input } of inputs) {
    if (seenNims.has(input.nim)) {
      issues.push({ row, message: `NIM ${input.nim} duplikat di dalam file.` });
    }
    seenNims.add(input.nim);
  }

  if (issues.length > 0) {
    return NextResponse.json(
      {
        error: "Impor dibatalkan. Perbaiki baris yang ditandai lalu unggah ulang.",
        issues: issues.slice(0, 100),
      },
      { status: 400 },
    );
  }

  try {
    const members = await createMembers(
      inputs.map(({ input }) => input),
      access.user.id,
    );
    return NextResponse.json({ members }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NIM sudah terdaftar:")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (
      error instanceof Error &&
      error.message.startsWith("Tidak ada periode aktif.")
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.startsWith("Divisi ")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : null;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "Ada NIM atau email yang sudah terdaftar. Tidak ada baris yang disimpan." },
        { status: 409 },
      );
    }

    console.error("Member spreadsheet import failed.", {
      code: typeof code === "string" ? code : "unknown",
    });
    return NextResponse.json(
      { error: "Impor gagal. Tidak ada baris yang disimpan; silakan coba kembali." },
      { status: 500 },
    );
  }
}
