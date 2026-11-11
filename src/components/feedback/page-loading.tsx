import Image from "next/image";
import styles from "./page-loading.module.css";

type PageLoadingProps = {
  title?: string;
  description?: string;
};

export function PageLoading({
  title = "Menyiapkan ruang kerja",
  description = "Mengambil data dan menyiapkan tampilan Anda.",
}: PageLoadingProps) {
  return (
    <main className={styles.screen}>
      <div
        className={styles.content}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className={styles.mascotStage} aria-hidden="true">
          <div className={styles.mascotArtwork}>
            <Image
              className={styles.mascot}
              src="/assets/mascot/feedback-loading.webp"
              alt=""
              width={256}
              height={256}
              priority
              unoptimized
            />
            <span className={`${styles.eyelid} ${styles.leftEyelid}`} />
            <span className={`${styles.eyelid} ${styles.rightEyelid}`} />
          </div>
        </div>

        <div className={styles.message}>
          <span className={styles.eyebrow}>
            <span className={styles.statusDot} />
            RESTEX <span className={styles.divider}>/</span> SEDANG MEMUAT
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </main>
  );
}
