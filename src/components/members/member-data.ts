export type MembershipStatus = "Aktif" | "Cuti" | "Keluar" | "Alumni";

export type Member = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  nim: string;
  division: string;
  cohort: string;
  status: MembershipStatus;
  attendance: number | null;
  joinedAt: string;
};

export type MemberCredential = Member & {
  initialPassword: string;
};

const legacyDivisionEmailCodes: Record<string, string> = {
  "Software Development": "sd",
  "Network & Security": "ns",
  "UI/UX Design": "ux",
  "Research & Development": "rd",
};

export function getPeriodEmailCode(periodName: string) {
  const years = periodName.match(/\d{4}/g);
  if (years && years.length >= 2) {
    return `${years[0].slice(-2)}${years[1].slice(-2)}`;
  }

  return periodName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function generateMemberEmail(
  name: string,
  division: string,
  periodName?: string,
) {
  const nameSlug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const divisionCode =
    legacyDivisionEmailCodes[division] ??
    division
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("id")
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 4);

  if (!nameSlug || !divisionCode) return "";
  const periodSuffix = periodName ? `_${getPeriodEmailCode(periodName)}` : "";
  return `${nameSlug}_${divisionCode}${periodSuffix}@restex.id`;
}

export const initialMembers: Member[] = [
  {
    id: "RTX-2026-001",
    name: "Aisyah Putri Ramadhani",
    email: generateMemberEmail("Aisyah Putri Ramadhani", "Programing"),
    nim: "2024001042",
    division: "Programing",
    cohort: "2024",
    status: "Aktif",
    attendance: 96,
    joinedAt: "12 Sep 2024",
  },
  {
    id: "RTX-2026-002",
    name: "Rizky Aditya Pratama",
    email: generateMemberEmail("Rizky Aditya Pratama", "Wiring & Electrical"),
    nim: "2024001087",
    division: "Wiring & Electrical",
    cohort: "2024",
    status: "Aktif",
    attendance: 92,
    joinedAt: "12 Sep 2024",
  },
  {
    id: "RTX-2026-003",
    name: "Nadia Safitri",
    email: generateMemberEmail("Nadia Safitri", "Research"),
    nim: "2024001125",
    division: "Research",
    cohort: "2024",
    status: "Aktif",
    attendance: 88,
    joinedAt: "18 Sep 2024",
  },
  {
    id: "RTX-2026-004",
    name: "Fajar Maulana",
    email: generateMemberEmail("Fajar Maulana", "Programing"),
    nim: "2023000931",
    division: "Programing",
    cohort: "2023",
    status: "Aktif",
    attendance: 84,
    joinedAt: "14 Sep 2023",
  },
  {
    id: "RTX-2026-005",
    name: "Putri Maharani",
    email: generateMemberEmail("Putri Maharani", "Research"),
    nim: "2024001183",
    division: "Research",
    cohort: "2024",
    status: "Aktif",
    attendance: 81,
    joinedAt: "20 Sep 2024",
  },
  {
    id: "RTX-2026-006",
    name: "Dimas Alfarizi",
    email: generateMemberEmail("Dimas Alfarizi", "Manufacture & Mechanical"),
    nim: "2023000968",
    division: "Manufacture & Mechanical",
    cohort: "2023",
    status: "Aktif",
    attendance: 76,
    joinedAt: "14 Sep 2023",
  },
  {
    id: "RTX-2026-007",
    name: "Naufal Hidayat",
    email: generateMemberEmail("Naufal Hidayat", "Programing"),
    nim: "2025002014",
    division: "Programing",
    cohort: "2025",
    status: "Aktif",
    attendance: 73,
    joinedAt: "06 Sep 2025",
  },
  {
    id: "RTX-2026-008",
    name: "Salsabila Putri",
    email: generateMemberEmail("Salsabila Putri", "Wiring & Electrical"),
    nim: "2024001220",
    division: "Wiring & Electrical",
    cohort: "2024",
    status: "Cuti",
    attendance: 68,
    joinedAt: "21 Sep 2024",
  },
  {
    id: "RTX-2025-041",
    name: "Bagas Prakoso",
    email: generateMemberEmail("Bagas Prakoso", "Research"),
    nim: "2022000872",
    division: "Research",
    cohort: "2022",
    status: "Keluar",
    attendance: 61,
    joinedAt: "11 Sep 2022",
  },
  {
    id: "RTX-2024-026",
    name: "Intan Permatasari",
    email: generateMemberEmail("Intan Permatasari", "Manufacture & Mechanical"),
    nim: "2021000564",
    division: "Manufacture & Mechanical",
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
