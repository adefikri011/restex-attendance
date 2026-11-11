import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type {
  AuditCategory,
  AuditEvent,
} from "@/components/audit-log/audit-log-data";
import { prisma } from "@/lib/prisma";

type AuditTransaction = Prisma.TransactionClient;

export type AuditAction =
  | "member.created"
  | "member.updated"
  | "period.created"
  | "division.created"
  | "division.updated"
  | "division.deleted"
  | "account.created"
  | "account.activated"
  | "account.deactivated"
  | "session.created"
  | "session.opened"
  | "session.closed"
  | "attendance.recorded"
  | "identity.qr_issued";

export type AuditEntity =
  | "member"
  | "period"
  | "division"
  | "account"
  | "session"
  | "attendance"
  | "identity";

export async function writeAuditLog(
  transaction: AuditTransaction,
  input: {
    actorId: string;
    action: AuditAction;
    entity: AuditEntity;
    entityId?: string | null;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
  },
) {
  await transaction.auditLog.create({
    data: {
      userId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      oldValue: input.oldValue,
      newValue: input.newValue,
    },
  });
}

const actionLabels: Record<AuditAction, string> = {
  "member.created": "Anggota ditambahkan",
  "member.updated": "Data anggota diperbarui",
  "period.created": "Periode kepengurusan dibuat",
  "division.created": "Divisi dibuat",
  "division.updated": "Divisi diperbarui",
  "division.deleted": "Divisi dihapus",
  "account.created": "Akun pengurus dibuat",
  "account.activated": "Akun pengurus diaktifkan",
  "account.deactivated": "Akun pengurus dinonaktifkan",
  "session.created": "Sesi absensi dibuka",
  "session.opened": "Sesi absensi dibuka kembali",
  "session.closed": "Sesi absensi ditutup",
  "attendance.recorded": "Kehadiran dicatat melalui QR",
  "identity.qr_issued": "QR anggota dibuat atau diperbarui",
};

const entityCategories: Record<AuditEntity, AuditCategory> = {
  member: "Keanggotaan",
  period: "Periode",
  division: "Keanggotaan",
  account: "Akun & akses",
  session: "Absensi",
  attendance: "Absensi",
  identity: "Identitas",
};

const categoryEntities: Record<AuditCategory, AuditEntity[]> = {
  Keanggotaan: ["member", "division"],
  Absensi: ["session", "attendance"],
  Periode: ["period"],
  "Akun & akses": ["account"],
  Identitas: ["identity"],
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  DIVISION_LEAD: "Ketua Divisi",
  DIVISION_PJ: "PJ Divisi",
  MEMBER: "Anggota",
};

const entityLabels: Record<AuditEntity, string> = {
  member: "Anggota",
  period: "Periode kepengurusan",
  division: "Divisi",
  account: "Akun pengurus",
  session: "Sesi absensi",
  attendance: "Kehadiran",
  identity: "Identitas anggota",
};

type AuditValue = Record<string, Prisma.JsonValue | undefined>;

function isAuditAction(value: string): value is AuditAction {
  return Object.hasOwn(actionLabels, value);
}

function isAuditEntity(value: string): value is AuditEntity {
  return Object.hasOwn(entityCategories, value);
}

function getValue(value: Prisma.JsonValue | null): AuditValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return value as AuditValue;
}

function getTarget(
  entity: AuditEntity,
  entityId: string | null,
  oldValue: AuditValue,
  newValue: AuditValue,
) {
  const keys =
    entity === "attendance"
      ? ["memberName", "title", "name"]
      : ["name", "title", "memberName"];
  const value = keys
    .map((key) => newValue[key] ?? oldValue[key])
    .find((candidate) => typeof candidate === "string");
  if (typeof value === "string" && value.length) return value;
  if (typeof newValue.memberCode === "string") return newValue.memberCode;
  return entityId ?? "Data tidak tersedia";
}

function formatValue(value: Prisma.JsonValue | undefined) {
  if (typeof value === "boolean") return value ? "Aktif" : "Nonaktif";
  if (typeof value !== "string") return undefined;
  const labels: Record<string, string> = {
    ACTIVE: "Aktif",
    ON_LEAVE: "Cuti",
    EXITED: "Keluar",
    ALUMNI: "Alumni",
    PRESENT: "Hadir",
    EXCUSED: "Izin",
    SICK: "Sakit",
    ABSENT: "Alpha",
    CLOSED: "Ditutup",
    ADMIN: "Admin",
    DIVISION_LEAD: "Ketua Divisi",
    DIVISION_PJ: "PJ Divisi",
  };
  return labels[value] ?? value;
}

function mapAuditEvent(row: {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  oldValue: Prisma.JsonValue | null;
  newValue: Prisma.JsonValue | null;
  occurredAt: Date;
  user: { name: string; role: string } | null;
}): AuditEvent | null {
  if (!isAuditAction(row.action) || !isAuditEntity(row.entity)) return null;
  const oldValue = getValue(row.oldValue);
  const newValue = getValue(row.newValue);
  const target = getTarget(row.entity, row.entityId, oldValue, newValue);
  const before = formatValue(
    oldValue.status ?? oldValue.role ?? oldValue.isActive ?? oldValue.name,
  );
  const after = formatValue(
    newValue.status ?? newValue.role ?? newValue.isActive ?? newValue.name,
  );
  const reason = typeof newValue.reason === "string" ? newValue.reason : undefined;

  return {
    id: row.id,
    timestamp: row.occurredAt.toISOString(),
    actor: row.user?.name ?? "Akun tidak tersedia",
    actorRole: row.user ? roleLabels[row.user.role] ?? row.user.role : "Tidak diketahui",
    category: entityCategories[row.entity],
    action: actionLabels[row.action],
    target,
    targetType: row.entityId
      ? `${entityLabels[row.entity]} · ${row.entityId}`
      : entityLabels[row.entity],
    summary: `${actionLabels[row.action]}: ${target}.`,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    ...(reason ? { reason } : {}),
  };
}

export type AuditLogFilters = {
  range: "7 hari" | "30 hari" | "Semua";
  category: "Semua" | AuditCategory;
  search: string;
  offset: number;
};

export async function getAuditLogPageData(filters: AuditLogFilters) {
  const now = new Date();
  const rangeStart =
    filters.range === "Semua"
      ? undefined
      : new Date(now.getTime() - (filters.range === "7 hari" ? 7 : 30) * 86_400_000);
  const query = filters.search.trim().slice(0, 100);
  const where: Prisma.AuditLogWhereInput = {
    ...(rangeStart ? { occurredAt: { gte: rangeStart } } : {}),
    ...(filters.category === "Semua"
      ? {}
      : { entity: { in: categoryEntities[filters.category] } }),
    ...(query
      ? {
          OR: [
            { action: { contains: query, mode: "insensitive" } },
            { entity: { contains: query, mode: "insensitive" } },
            { entityId: { contains: query, mode: "insensitive" } },
            { user: { name: { contains: query, mode: "insensitive" } } },
            { newValue: { path: ["name"], string_contains: query } },
            { newValue: { path: ["memberName"], string_contains: query } },
            { newValue: { path: ["memberCode"], string_contains: query } },
            { newValue: { path: ["title"], string_contains: query } },
            { newValue: { path: ["division"], string_contains: query } },
          ],
        }
      : {}),
  };

  const [rows, totalCount, recentCount, actorRows, entityRows, filteredCount] =
    await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        skip: Math.max(0, Math.floor(filters.offset)),
        take: 50,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          oldValue: true,
          newValue: true,
          occurredAt: true,
          user: { select: { name: true, role: true } },
        },
      }),
      prisma.auditLog.count(),
      prisma.auditLog.count({
        where: { occurredAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } },
      }),
      prisma.auditLog.groupBy({
        by: ["userId"],
        where: { userId: { not: null } },
      }),
      prisma.auditLog.groupBy({ by: ["entity"] }),
      prisma.auditLog.count({ where }),
    ]);

  const events = rows.flatMap((row) => {
    const event = mapAuditEvent(row);
    return event ? [event] : [];
  });
  const categoryCount = new Set(
    entityRows.flatMap(({ entity }) =>
      isAuditEntity(entity) ? [entityCategories[entity]] : [],
    ),
  ).size;

  return {
    events,
    totalCount,
    filteredCount,
    hasMore: filters.offset + rows.length < filteredCount,
    nextOffset: filters.offset + rows.length,
    metrics: {
      totalCount,
      recentCount,
      actorCount: actorRows.length,
      categoryCount,
    },
  };
}
