export const administratorRoles = [
  "Super Admin",
  "Admin",
  "Ketua Divisi",
] as const;

export type AdministratorRole = (typeof administratorRoles)[number];
export type AdministratorAccountStatus = "Aktif" | "Nonaktif";

export type AdministratorAccount = {
  id: string;
  name: string;
  email: string;
  role: AdministratorRole;
  division: string | null;
  status: AdministratorAccountStatus;
  lastActiveAt: string | null;
};

export const organizationDivisions = [
  "Software Development",
  "Network & Security",
  "UI/UX Design",
  "Research & Development",
] as const;

export function getAdministratorInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
