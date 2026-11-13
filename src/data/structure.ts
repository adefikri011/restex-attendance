import { ACTIVE_PERIOD } from "./active-period";

export type OfficerGroup = "bph" | "pj-divisi" | "humas-infokom";

export type Officer = {
  id: string;
  name: string;
  position: string;
  group: OfficerGroup;
  division?: string;
  photo?: string;
  order: number;
};

export type PeriodStructure = {
  slug: string;
  label: string;
  officers: Officer[];
};

export type StructurePeriod = Pick<PeriodStructure, "slug" | "label">;

const BPH_OFFICERS: Officer[] = [
  // TODO: Cocokkan nama dengan halaman resmi RESTEX di saac.nusaputra.ac.id/restex/; verifikasi ejaan kepada masing-masing orang dan konfirmasi periode.
  {
    id: "aziz-ramadhan",
    name: "Aziz Ramadhan",
    position: "Ketua Umum",
    group: "bph",
    order: 1,
  },
  {
    id: "reza-ariansah",
    name: "Reza Ariansah",
    position: "Wakil Ketua Umum",
    group: "bph",
    order: 2,
  },
  {
    id: "annisa-siti-farizha-ramlan",
    name: "Annisa Siti Farizha Ramlan",
    position: "Sekretaris Umum",
    group: "bph",
    order: 3,
  },
  {
    id: "salwa-nedaliansa-azzahra",
    name: "Salwa Nedaliansa Azzahra",
    position: "Bendahara Umum",
    group: "bph",
    order: 4,
  },
];

// TODO: Tambahkan PJ Divisi setelah nama dan persetujuan publikasi tersedia.
// Nama divisi yang valid: Wiring & Electrical, Programming, Research,
// Manufacture & Mechanical.
const PJ_DIVISION_OFFICERS: Officer[] = [];

// TODO: Tambahkan Humas & Infokom setelah nama tersedia.
const HUMAS_INFO_KOM_OFFICERS: Officer[] = [];

const STRUCTURES: PeriodStructure[] = [
  {
    ...ACTIVE_PERIOD,
    officers: [
      ...BPH_OFFICERS,
      ...PJ_DIVISION_OFFICERS,
      ...HUMAS_INFO_KOM_OFFICERS,
    ],
  },
];

export async function getStructure(
  periodSlug?: string,
): Promise<PeriodStructure | undefined> {
  const period = periodSlug
    ? STRUCTURES.find(({ slug }) => slug === periodSlug)
    : STRUCTURES[0];

  if (!period) return undefined;

  return {
    ...period,
    officers: [...period.officers].sort((a, b) => a.order - b.order),
  };
}

export async function getPeriods(): Promise<StructurePeriod[]> {
  return STRUCTURES.map(({ slug, label }) => ({ slug, label }));
}

// Only names, positions, and approved photos may be shown publicly.
// Add a photo only after the person has consented to its publication.
