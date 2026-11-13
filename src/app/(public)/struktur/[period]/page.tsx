import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StructurePage } from "@/components/structure/structure-page";
import { getPeriods, getStructure } from "@/data/structure";

type PeriodPageProps = {
  params: Promise<{ period: string }>;
};

export async function generateStaticParams() {
  const periods = await getPeriods();
  return periods.map(({ slug }) => ({ period: slug }));
}

export async function generateMetadata({
  params,
}: PeriodPageProps): Promise<Metadata> {
  const { period: slug } = await params;
  const structure = await getStructure(slug);

  if (!structure) {
    return {
      title: "Struktur Organisasi | RESTEX",
      description: "Susunan pengurus Unit Kegiatan Mahasiswa Rekayasa Teknologi.",
    };
  }

  return {
    title: `Struktur Organisasi ${structure.label} | RESTEX`,
    description: `Susunan pengurus RESTEX periode ${structure.label}.`,
  };
}

export default async function PeriodStructurePage({ params }: PeriodPageProps) {
  const { period: slug } = await params;
  const [periods, structure] = await Promise.all([
    getPeriods(),
    getStructure(slug),
  ]);

  if (!structure) notFound();

  return <StructurePage structure={structure} periods={periods} />;
}
