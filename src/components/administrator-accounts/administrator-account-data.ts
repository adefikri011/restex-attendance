import { initialMembers } from "@/components/members/member-data";

export const administratorRoles = [
  "Super Admin",
  "Admin",
  "Ketua Divisi",
] as const;

export type AdministratorRole = (typeof administratorRoles)[number];
export type AdministratorAccountStatus = "Aktif" | "Undangan terkirim" | "Nonaktif";

export type AdministratorAccount = {
  id: string;
  name: string;
  email: string;
  role: AdministratorRole;
  division: string | null;
  status: AdministratorAccountStatus;
  lastActiveAt: string | null;
  inviteSentAt?: string;
};

export const organizationDivisions = [
  "Software Development",
  "Network & Security",
  "UI/UX Design",
  "Research & Development",
] as const;

export const initialAdministratorAccounts: AdministratorAccount[] = [
  {
    id: "USR-001",
    name: "Fikri Ramadhan",
    email: "fikri.ramadhan@restex.id",
    role: "Super Admin",
    division: null,
    status: "Aktif",
    lastActiveAt: "10 Nov 2026 · 13.20",
  },
  {
    id: "USR-002",
    name: "Nadia Kurnia",
    email: "nadia.kurnia@restex.id",
    role: "Admin",
    division: null,
    status: "Aktif",
    lastActiveAt: "10 Nov 2026 · 11.42",
  },
  {
    id: "USR-003",
    name: "Aisyah Putri Ramadhani",
    email: "aisyah.putri@restex.id",
    role: "Ketua Divisi",
    division: "Software Development",
    status: "Aktif",
    lastActiveAt: "10 Nov 2026 · 10.18",
  },
  {
    id: "USR-004",
    name: "Rizky Aditya Pratama",
    email: "rizky.aditya@restex.id",
    role: "Ketua Divisi",
    division: "Network & Security",
    status: "Aktif",
    lastActiveAt: "09 Nov 2026 · 18.06",
  },
  {
    id: "USR-005",
    name: "Nadia Safitri",
    email: "nadia.safitri@restex.id",
    role: "Ketua Divisi",
    division: "UI/UX Design",
    status: "Aktif",
    lastActiveAt: "09 Nov 2026 · 14.32",
  },
  {
    id: "USR-006",
    name: "Putri Maharani",
    email: "putri.maharani@restex.id",
    role: "Ketua Divisi",
    division: "Research & Development",
    status: "Aktif",
    lastActiveAt: "08 Nov 2026 · 16.51",
  },
  {
    id: "USR-007",
    name: "Rafi Pratama",
    email: "rafi.pratama@restex.id",
    role: "Admin",
    division: null,
    status: "Undangan terkirim",
    lastActiveAt: null,
    inviteSentAt: "10 Nov 2026",
  },
  {
    id: "USR-008",
    name: "Dimas Alfarizi",
    email: "dimas.alfarizi@restex.id",
    role: "Ketua Divisi",
    division: "Network & Security",
    status: "Nonaktif",
    lastActiveAt: "20 Okt 2026 · 09.15",
  },
];

export const divisionMemberCounts = Object.fromEntries(
  organizationDivisions.map((division) => [
    division,
    initialMembers.filter(
      (member) => member.division === division && member.status === "Aktif",
    ).length,
  ]),
) as Record<(typeof organizationDivisions)[number], number>;

export function getAdministratorInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
