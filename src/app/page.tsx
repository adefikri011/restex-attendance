import type { Metadata } from "next";
import { LandingAbout } from "@/components/landing/landing-about";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "RESTEX | Unit Kegiatan Mahasiswa Rekayasa Teknologi",
  description:
    "Website resmi Unit Kegiatan Mahasiswa Rekayasa Teknologi.",
};

export default function Home() {
  return (
    <main className={styles.page}>
      <LandingNavbar />
      <LandingHero />
      <LandingAbout />
    </main>
  );
}
