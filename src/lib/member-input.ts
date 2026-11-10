import {
  memberDivisions,
  membershipStatuses,
  type MembershipStatus,
} from "@/components/members/member-data";
import type { NewMemberInput } from "@/lib/member-service";

type ValidationResult =
  | { input: NewMemberInput; error: null }
  | { input: null; error: string };

function isMembershipStatus(value: string): value is MembershipStatus {
  return membershipStatuses.some((status) => status === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateMemberInput(value: unknown): ValidationResult {
  if (!isRecord(value)) {
    return { input: null, error: "Format data anggota tidak valid." };
  }

  const name = typeof value.name === "string" ? value.name.trim() : "";
  const nim = typeof value.nim === "string" ? value.nim.trim() : "";
  const division =
    typeof value.division === "string" ? value.division.trim() : "";
  const cohort =
    typeof value.cohort === "string" ? value.cohort.trim() : "";
  const rawStatus =
    typeof value.status === "string" ? value.status.trim() : "Aktif";
  const status =
    membershipStatuses.find(
      (item) => item.toLocaleLowerCase("id") === rawStatus.toLocaleLowerCase("id"),
    ) ?? rawStatus;

  if (name.length < 2 || name.length > 160) {
    return { input: null, error: "Nama harus terdiri dari 2–160 karakter." };
  }
  if (!nim || nim.length > 32) {
    return { input: null, error: "NIM harus terdiri dari 1–32 karakter." };
  }
  if (!memberDivisions.includes(division)) {
    return { input: null, error: "Divisi tidak dikenal." };
  }
  if (!/^\d{4}$/.test(cohort)) {
    return { input: null, error: "Angkatan harus berupa tahun 4 digit." };
  }
  if (!isMembershipStatus(status)) {
    return { input: null, error: "Status keanggotaan tidak dikenal." };
  }

  return {
    input: {
      name,
      nim,
      division,
      cohort,
      status,
    },
    error: null,
  };
}
