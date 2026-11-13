import type { Metadata } from "next";
import { StructurePage } from "@/components/structure/structure-page";
import { getPeriods, getStructure } from "@/data/structure";

export async function generateMetadata(): Promise<Metadata> {
  const [period] = await getPeriods();

  if (!period) {
    return {
      title: "Struktur Organisasi | RESTEX",
      description: "Susunan pengurus Unit Kegiatan Mahasiswa Rekayasa Teknologi.",
    };
  }

  return {
    title: `Struktur Organisasi ${period.label} | RESTEX`,
    description: `Susunan pengurus RESTEX periode ${period.label}.`,
  };
}

export default async function StructureIndexPage() {
  const [periods, structure] = await Promise.all([
    getPeriods(),
    getStructure(),
  ]);

  return <StructurePage structure={structure} periods={periods} />;
}
