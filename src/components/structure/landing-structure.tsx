import Link from "next/link";
import { getStructure } from "@/data/structure";
import { OfficerRack } from "./officer-rack";
import styles from "./landing-structure.module.css";

export async function LandingStructure() {
  const structure = await getStructure();
  const officers =
    structure?.officers
      .filter((officer) => officer.group === "bph")
      .slice(0, 4) ?? [];

  if (!structure || officers.length === 0) return null;

  return (
    <section
      className={styles.section}
      id="struktur"
      aria-labelledby="struktur-judul"
    >
      <div className={`${styles.content} site-container`}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <h2 className={styles.title} id="struktur-judul">
              Pengurus periode {structure.label}
            </h2>
            <p className={styles.lead}>
              Mahasiswa Nusa Putra yang menjalankan RESTEX tahun ini.
            </p>
          </div>
          <Link className={styles.completeLink} href="/struktur">
            Lihat susunan lengkap <span aria-hidden="true">→</span>
          </Link>
        </header>
        <div className={styles.rack}>
          <OfficerRack officers={officers} />
        </div>
      </div>
    </section>
  );
}
