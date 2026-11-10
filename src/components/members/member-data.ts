export type MembershipStatus = "Aktif" | "Cuti" | "Keluar" | "Alumni";

export type Member = {
  id: string;
  name: string;
  nim: string;
  division: string;
  cohort: string;
  status: MembershipStatus;
  attendance: number | null;
  joinedAt: string;
};

export const initialMembers: Member[] = [
  {
    id: "RTX-2026-001",
    name: "Aisyah Putri Ramadhani",
    nim: "2024001042",
    division: "Software Development",
    cohort: "2024",
    status: "Aktif",
    attendance: 96,
    joinedAt: "12 Sep 2024",
  },
  {
    id: "RTX-2026-002",
    name: "Rizky Aditya Pratama",
    nim: "2024001087",
    division: "Network & Security",
    cohort: "2024",
    status: "Aktif",
    attendance: 92,
    joinedAt: "12 Sep 2024",
  },
  {
    id: "RTX-2026-003",
    name: "Nadia Safitri",
    nim: "2024001125",
    division: "UI/UX Design",
    cohort: "2024",
    status: "Aktif",
    attendance: 88,
    joinedAt: "18 Sep 2024",
  },
  {
    id: "RTX-2026-004",
    name: "Fajar Maulana",
    nim: "2023000931",
    division: "Software Development",
    cohort: "2023",
    status: "Aktif",
    attendance: 84,
    joinedAt: "14 Sep 2023",
  },
  {
    id: "RTX-2026-005",
    name: "Putri Maharani",
    nim: "2024001183",
    division: "Research & Development",
    cohort: "2024",
    status: "Aktif",
    attendance: 81,
    joinedAt: "20 Sep 2024",
  },
  {
    id: "RTX-2026-006",
    name: "Dimas Alfarizi",
    nim: "2023000968",
    division: "Network & Security",
    cohort: "2023",
    status: "Aktif",
    attendance: 76,
    joinedAt: "14 Sep 2023",
  },
  {
    id: "RTX-2026-007",
    name: "Naufal Hidayat",
    nim: "2025002014",
    division: "Software Development",
    cohort: "2025",
    status: "Aktif",
    attendance: 73,
    joinedAt: "06 Sep 2025",
  },
  {
    id: "RTX-2026-008",
    name: "Salsabila Putri",
    nim: "2024001220",
    division: "UI/UX Design",
    cohort: "2024",
    status: "Cuti",
    attendance: 68,
    joinedAt: "21 Sep 2024",
  },
  {
    id: "RTX-2025-041",
    name: "Bagas Prakoso",
    nim: "2022000872",
    division: "Research & Development",
    cohort: "2022",
    status: "Keluar",
    attendance: 61,
    joinedAt: "11 Sep 2022",
  },
  {
    id: "RTX-2024-026",
    name: "Intan Permatasari",
    nim: "2021000564",
    division: "Network & Security",
    cohort: "2021",
    status: "Alumni",
    attendance: 89,
    joinedAt: "09 Sep 2021",
  },
];

export const membershipStatuses: MembershipStatus[] = [
  "Aktif",
  "Cuti",
  "Keluar",
  "Alumni",
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
