import { Readable } from "node:stream";
import { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth-guard";
import {
  createOfficerAssignmentsFromImport,
  previewOfficerAssignmentImport,
  type OfficerAssignmentImportInput,
} from "@/lib/page-access-service";
import {
  MAX_OFFICER_IMPORT_FILE_SIZE,
  MAX_OFFICER_IMPORT_ROWS,
} from "@/lib/officer-assignment-import-constants";

type HeaderKey = "nim" | "name" | "cohort" | "position" | "division";

const columnAliases: Record<HeaderKey, string[]> = {
  nim: ["nim", "nomorindukmahasiswa"],
  name: ["nama", "namalengkap", "name", "fullname"],
  cohort: ["angkatan", "angkatanopsional", "cohort", "tahunangkatan"],
  position: ["jabatan", "posisi", "position"],
  division: ["divisi", "division"],
};

function normalizeHeader(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getHeaders(worksheet: import("exceljs").Worksheet) {
  const headers = new Map<string, number>();
  worksheet.getRow(1).eachCell((cell, column) => {
    const key = normalizeHeader(cell.text);
    if (key) headers.set(key, column);
  });
  return headers;
}

function getColumn(headers: Map<string, number>, aliases: string[]) {
  return aliases
    .map((alias) => headers.get(alias))
    .find((column) => column !== undefined);
}

function readCell(row: import("exceljs").Row, column: number | undefined) {
  return column ? row.getCell(column).text.trim() : "";
}

async function readImportFile(file: File) {
  let workbook: import("exceljs").Workbook;
  try {
    const { Workbook } = await import("exceljs");
    workbook = new Workbook();
    await workbook.xlsx.read(
      Readable.from([Buffer.from(await file.arrayBuffer())]),
    );
  } catch {
    throw new Error("File Excel rusak atau tidak dapat dibaca.");
  }

  const namedSheet = workbook.getWorksheet("Pengurus");
  const worksheet =
    workbook.worksheets.find(
      (sheet) =>
        sheet.name === "Pengurus" &&
        sheet.state === "visible" &&
        ["nim", "name", "position"].every((key) =>
          columnAliases[key as HeaderKey].some((alias) =>
            getHeaders(sheet).has(alias),
          ),
        ),
    ) ??
    workbook.worksheets.find((sheet) => sheet.state === "visible") ??
    (namedSheet?.state === "visible" ? namedSheet : undefined);
  if (!worksheet) throw new Error("Sheet Pengurus tidak ditemukan.");
  if (worksheet.rowCount < 2) throw new Error("File belum memiliki baris data.");
  if (worksheet.rowCount > MAX_OFFICER_IMPORT_ROWS + 1) {
    throw new Error(`Maksimal ${MAX_OFFICER_IMPORT_ROWS} baris pengurus per file.`);
  }

  const headers = getHeaders(worksheet);
  const columns = {
    nim: getColumn(headers, columnAliases.nim),
    name: getColumn(headers, columnAliases.name),
    cohort: getColumn(headers, columnAliases.cohort),
    position: getColumn(headers, columnAliases.position),
    division: getColumn(headers, columnAliases.division),
  };
  const missingHeaders = (["nim", "name", "position"] as const)
    .filter((key) => !columns[key])
    .map((key) => {
      if (key === "nim") return "NIM";
      if (key === "name") return "Nama";
      return "Jabatan";
    });
  if (missingHeaders.length) {
    throw new Error(`Kolom wajib tidak ditemukan: ${missingHeaders.join(", ")}.`);
  }

  const inputs: OfficerAssignmentImportInput[] = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = {
      nim: readCell(row, columns.nim),
      name: readCell(row, columns.name),
      cohort: readCell(row, columns.cohort) || null,
      position: readCell(row, columns.position),
      division: readCell(row, columns.division),
    };
    if (Object.values(values).every((value) => !value)) continue;
    inputs.push({ rowNumber, ...values });
  }
  if (!inputs.length) throw new Error("Tidak ada data pengurus untuk diimpor.");
  return { inputs };
}

async function readRequest(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_OFFICER_IMPORT_FILE_SIZE + 64_000) {
    throw new Error("Ukuran file maksimal 2 MB.");
  }
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new Error("Format unggahan tidak valid.");
  }
  const file = formData.get("file");
  const periodId = formData.get("periodId");
  const mode = formData.get("mode");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Pilih file Excel (.xlsx) terlebih dahulu.");
  }
  if (file.size > MAX_OFFICER_IMPORT_FILE_SIZE) {
    throw new Error("Ukuran file maksimal 2 MB.");
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Format yang didukung hanya file Excel .xlsx.");
  }
  if (typeof periodId !== "string" || !periodId) {
    throw new Error("Pilih periode tujuan.");
  }
  if (mode !== "preview" && mode !== "commit") {
    throw new Error("Tahap impor tidak valid.");
  }
  return { file, periodId, mode };
}

export async function POST(request: Request) {
  const access = await getApiUser(["super-admin"]);
  if (!access.user) {
    return NextResponse.json(
      { error: "Hanya Super Admin yang dapat mengimpor susunan pengurus." },
      { status: access.status },
    );
  }

  let parsedRequest: Awaited<ReturnType<typeof readRequest>>;
  try {
    parsedRequest = await readRequest(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Permintaan impor tidak valid." },
      { status: 400 },
    );
  }

  let parsedFile: Awaited<ReturnType<typeof readImportFile>>;
  try {
    parsedFile = await readImportFile(parsedRequest.file);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "File Excel tidak valid." },
      { status: 400 },
    );
  }

  try {
    const preview = await previewOfficerAssignmentImport(
      parsedRequest.periodId,
      parsedFile.inputs,
    );
    const issues = preview.issues.slice(0, 100);
    if (parsedRequest.mode === "preview") {
      return NextResponse.json({
        rows: preview.rows,
        issues,
        totalIssueCount: preview.issues.length,
      });
    }

    if (issues.length) {
      return NextResponse.json(
        {
          error: "Impor dibatalkan. Perbaiki baris yang ditandai lalu unggah ulang.",
          issues,
          totalIssueCount: preview.issues.length,
        },
        { status: 400 },
      );
    }

    const result = await createOfficerAssignmentsFromImport(
      parsedRequest.periodId,
      parsedFile.inputs,
      access.user.id,
    );
    if (result.issues.length) {
      return NextResponse.json(
        {
          error: "Impor dibatalkan. Perbaiki baris yang ditandai lalu unggah ulang.",
          issues: result.issues.slice(0, 100),
          totalIssueCount: result.issues.length,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        createdCount: result.createdCount,
        createdMembersCount: result.createdMembersCount,
        createdAccounts: result.createdAccounts,
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      return NextResponse.json(
        { error: "Susunan berubah bersamaan. Muat ulang data dan pratinjau ulang sebelum menyimpan." },
        { status: 409 },
      );
    }
    if (
      error instanceof Error &&
      error.message === "Data akun anggota berubah bersamaan. Muat ulang lalu coba lagi."
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message === "Periode tujuan tidak ditemukan.") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Officer assignment spreadsheet import failed.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Impor roster pengurus gagal diproses. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
