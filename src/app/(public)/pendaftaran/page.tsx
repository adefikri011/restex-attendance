import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ApplicationForm } from "@/components/recruitment/application-form";
import { getCachedRecruitmentConfig } from "@/lib/recruitment-cache";
import { ArrowLeft, ArrowUpRight, LockKeyhole } from "lucide-react";
import styles from "../gabung/page.module.css";

export const metadata: Metadata = {
  title: "Pendaftaran Anggota | RESTEX",
  description: "Lengkapi data awal pendaftaran anggota RESTEX.",
};

export const instant = false;

export default async function RegistrationPage() {
  await connection();
  const { status } = await getCachedRecruitmentConfig();

  return (
    <main className={styles.page}>
      <div className={`${styles.content} site-container`}>
        <nav className={styles.topbar} aria-label="Navigasi pendaftaran">
          <Link className={styles.brand} href="/">
            <span className={styles.brandMark} aria-hidden="true">R</span>
            <span className={styles.brandName}>RESTEX<span>REKRUTMEN</span></span>
          </Link>
          <Link className={styles.homeLink} href="/">
            <ArrowLeft size={15} aria-hidden="true" />
            Kembali ke beranda
          </Link>
        </nav>

        <div className={styles.applicationLayout}>
          <aside className={styles.journeyPanel}>
            <div className={styles.journeyGlow} aria-hidden="true" />
            <div className={styles.journeyContent}>
              <p className={styles.eyebrow}>PENDAFTARAN ANGGOTA</p>
              <h1 className={styles.title}>Mulai dari cerita tentang dirimu.</h1>
              <p className={styles.lead}>
                Lengkapi data awal untuk memulai proses seleksi anggota RESTEX.
              </p>

              <div className={styles.progressLabel}>
                <span>ALUR SELEKSI</span>
                <span>01 <i>/ 04</i></span>
              </div>
              <ol className={styles.steps}>
                <li className={styles.activeStep} aria-current="step">
                  <span className={styles.stepMarker}>01</span>
                  <span><strong>Data awal</strong><small>Isi identitas dan alasan bergabung</small></span>
                </li>
                <li>
                  <span className={styles.stepMarker}>02</span>
                  <span><strong>Screening</strong><small>Data ditinjau oleh tim RESTEX</small></span>
                </li>
                <li>
                  <span className={styles.stepMarker}>03</span>
                  <span><strong>Tahap lanjutan</strong><small>Pertemuan dan formulir berikutnya</small></span>
                </li>
                <li>
                  <span className={styles.stepMarker}>04</span>
                  <span><strong>Pengumuman</strong><small>Pantau hasil melalui akunmu</small></span>
                </li>
              </ol>

              <div className={styles.privacyNote}>
                <span><LockKeyhole size={16} aria-hidden="true" /></span>
                <p>Data yang kamu kirim digunakan untuk proses seleksi anggota RESTEX.</p>
              </div>
              <Link className={styles.learnMore} href="/#gabung">
                Tentang RESTEX <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.panelIndex} aria-hidden="true">RESTEX · REKRUTMEN</div>
          </aside>

          <div className={styles.formColumn}>
            {status.state === "open" ? (
              <ApplicationForm />
            ) : (
              <section className={styles.closedPanel} aria-live="polite">
                <span className={styles.closedIcon} aria-hidden="true">
                  <LockKeyhole size={20} />
                </span>
                <p className={styles.closedEyebrow}>PENDAFTARAN RESTEX</p>
                <h2>Pendaftaran belum dibuka</h2>
                <p>
                  Pantau kembali halaman ini saat pendaftaran anggota RESTEX dimulai.
                </p>
                <Link href="/" className={styles.closedLink}>Kembali ke beranda</Link>
              </section>
            )}
            <p className={styles.footerNote}>
              Mengalami kendala? <Link href="/#gabung">Lihat informasi pendaftaran</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
