import "server-only";

import { getDivisionNames } from "@/lib/division-service";

export type LandingDivision = {
  name: string;
  description: string;
};

const DESCRIPTION_PLACEHOLDER = "Deskripsi divisi belum tersedia.";

export async function getLandingDivisions(): Promise<LandingDivision[]> {
  const names = await getDivisionNames();

  return names.map((name) => ({
    name: name === "Programing" ? "Programming" : name,
    description: DESCRIPTION_PLACEHOLDER,
  }));
}
