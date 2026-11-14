import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { LandingAbout } from "@/components/landing/landing-about";
import { LandingAnnouncements } from "@/components/landing/landing-announcements";
import { LandingDivisions } from "@/components/landing/landing-divisions";
import { getLandingDivisions } from "@/components/landing/landing-division-data";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingJoin } from "@/components/landing/landing-join";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingProjects } from "@/components/landing/landing-projects";
import { LandingStructure } from "@/components/structure/landing-structure";
import { getCachedRecruitmentConfig } from "@/lib/recruitment-cache";
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

export default async function Home() {
  await connection();
  const { settings: recruitmentSettings, status: recruitmentStatus } =
    await getCachedRecruitmentConfig();

  return (
    <>
      <main className={styles.page} id="top">
        <LandingNavbar />
        <LandingHero
          recruitmentStatus={recruitmentStatus}
          recruitmentSettings={recruitmentSettings}
        />
        <LandingAbout />
        <Suspense fallback={<LandingDivisions divisions={[]} />}>
          <LandingDivisionsContent />
        </Suspense>
        <LandingAnnouncements recruitmentStatus={recruitmentStatus} />
        <LandingProjects />
        <LandingStructure />
        <LandingJoin
          status={recruitmentStatus}
          settings={recruitmentSettings}
        />
      </main>
      <LandingFooter />
    </>
  );
}
