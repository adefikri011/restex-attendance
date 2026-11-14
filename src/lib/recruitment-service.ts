import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { RECRUITMENT, type RecruitmentSettings } from "@/lib/recruitment";
import { writeAuditLog } from "@/lib/audit-log-service";
import { prisma } from "@/lib/prisma";

export class RecruitmentSettingsError extends Error {}

function dateToString(date: Date | null) {
  return date?.toISOString().slice(0, 10);
}

function toSettings(row: {
  open: boolean;
  opensAt: Date | null;
  closesAt: Date | null;
  registerUrl: string;
  notifyUrl: string;
}): RecruitmentSettings {
  return {
    open: row.open,
    opensAt: dateToString(row.opensAt),
    closesAt: dateToString(row.closesAt),
    registerUrl: row.registerUrl,
    notifyUrl: row.notifyUrl,
  };
}

export async function getRecruitmentSettings(): Promise<RecruitmentSettings> {
  const row = await prisma.recruitmentSetting.findUnique({
    where: { id: "global" },
    select: {
      open: true,
      opensAt: true,
      closesAt: true,
      registerUrl: true,
      notifyUrl: true,
    },
  });
  return row ? toSettings(row) : RECRUITMENT;
}

function validateDate(value: string | undefined, fieldName: string) {
  if (value === undefined || value === "") return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RecruitmentSettingsError(`${fieldName} harus berformat YYYY-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RecruitmentSettingsError(`${fieldName} bukan tanggal yang valid.`);
  }
  return date;
}

function validateUrl(value: string, fieldName: string) {
  const url = value.trim();
  if (url.length > 2048) {
    throw new RecruitmentSettingsError(`${fieldName} maksimal 2048 karakter.`);
  }
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (
      parsed.protocol === "https:" &&
      parsed.username === "" &&
      parsed.password === ""
    ) {
      return url;
    }
  } catch {
    throw new RecruitmentSettingsError(
      `${fieldName} harus berupa tautan internal atau HTTPS.`,
    );
  }
  throw new RecruitmentSettingsError(
    `${fieldName} harus berupa tautan internal atau HTTPS.`,
  );
}

function toAuditValue(settings: RecruitmentSettings): Prisma.InputJsonObject {
  return {
    name: "Pengaturan pendaftaran",
    status: settings.open ? "Dibuka" : "Belum dibuka",
    opensAt: settings.opensAt ?? "Tidak ditentukan",
    closesAt: settings.closesAt ?? "Tidak ditentukan",
    registerUrl: settings.registerUrl || "Tidak diatur",
    notifyUrl: settings.notifyUrl || "Tidak diatur",
  };
}

export async function updateRecruitmentSettings(
  input: RecruitmentSettings,
  actorId: string,
) {
  if (typeof input.open !== "boolean") {
    throw new RecruitmentSettingsError("Status pendaftaran tidak valid.");
  }
  const opensAt = validateDate(input.opensAt, "Tanggal pembukaan");
  const closesAt = validateDate(input.closesAt, "Tanggal penutupan");
  if (
    opensAt &&
    closesAt &&
    closesAt.getTime() < opensAt.getTime()
  ) {
    throw new RecruitmentSettingsError(
      "Tanggal penutupan harus sama dengan atau setelah tanggal pembukaan.",
    );
  }

  const settings: RecruitmentSettings = {
    open: input.open,
    opensAt: opensAt?.toISOString().slice(0, 10),
    closesAt: closesAt?.toISOString().slice(0, 10),
    registerUrl: validateUrl(input.registerUrl, "URL pendaftaran"),
    notifyUrl: validateUrl(input.notifyUrl, "URL pemberitahuan"),
  };

  await prisma.$transaction(async (transaction) => {
    const existing = await transaction.recruitmentSetting.findUnique({
      where: { id: "global" },
      select: {
        open: true,
        opensAt: true,
        closesAt: true,
        registerUrl: true,
        notifyUrl: true,
      },
    });
    await transaction.recruitmentSetting.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        open: settings.open,
        opensAt,
        closesAt,
        registerUrl: settings.registerUrl,
        notifyUrl: settings.notifyUrl,
      },
      update: {
        open: settings.open,
        opensAt,
        closesAt,
        registerUrl: settings.registerUrl,
        notifyUrl: settings.notifyUrl,
      },
    });
    await writeAuditLog(transaction, {
      actorId,
      action: "recruitment.updated",
      entity: "recruitment",
      entityId: "global",
      oldValue: existing ? toAuditValue(toSettings(existing)) : undefined,
      newValue: toAuditValue(settings),
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  return settings;
}
