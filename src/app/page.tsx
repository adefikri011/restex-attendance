import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LandingAbout } from "@/components/landing/landing-about";
import { LandingAnnouncements } from "@/components/landing/landing-announcements";
import { LandingDivisions } from "@/components/landing/landing-divisions";
import { getLandingDivisions } from "@/components/landing/landing-division-data";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingProjects } from "@/components/landing/landing-projects";
import { LandingStructure } from "@/components/structure/landing-structure";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "RESTEX | Unit Kegiatan Mahasiswa Rekayasa Teknologi",
  description:
    "Website resmi Unit Kegiatan Mahasiswa Rekayasa Teknologi.",
};

async function LandingDivisionsContent() {
  await connection();
  const divisions = await getLandingDivisions();
  return <LandingDivisions divisions={divisions} />;
}

export default function Home() {
  return (
    <>
      <main className={styles.page} id="top">
        <LandingNavbar />
        <LandingHero />
        <LandingAbout />
        <Suspense fallback={<LandingDivisions divisions={[]} />}>
          <LandingDivisionsContent />
        </Suspense>
        <LandingAnnouncements />
        <LandingProjects />
        <LandingStructure />
      </main>
      <LandingFooter />
    </>
  );
}
