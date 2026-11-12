import type { Metadata } from "next";
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
    </main>
  );
}
