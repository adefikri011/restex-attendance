import styles from "./landing-about.module.css";

const purposes = [
  { title: "Awareness Rising", subtitle: "Peningkatan kesadaran" },
  { title: "Capacity Building", subtitle: "Membangun kapasitas" },
  { title: "Advokasi", subtitle: "Menyuarakan gagasan teknologi" },
  { title: "Kerja sama", subtitle: "Menjalin kolaborasi" },
];

export function LandingAbout() {
  return (
    <section
      className={styles.section}
      id="tentang"
      aria-labelledby="landing-about-title"
    >
      <div className={`${styles.content} site-container`}>
        <p className={styles.eyebrow}>
          Tentang RESTEX
        </p>

        <div className={styles.introduction}>
          <h2 className={styles.title} id="landing-about-title">
            Ruang untuk mengembangkan teknologi bersama.
          </h2>
          <p className={styles.description}>
            RESTEX (Rekayasa Teknologi) adalah Unit Kegiatan Mahasiswa
            Universitas Nusa Putra yang bergerak di bidang riset, inovasi, dan
            pengembangan teknologi modern.
          </p>
        </div>

        <div className={styles.purposes}>
          <div className={styles.purposeHeading}>
            <span>Empat tujuan RESTEX</span>
          </div>
          <ol className={styles.purposeList}>
            {purposes.map((purpose, index) => (
              <li className={styles.purposeItem} key={purpose.title}>
                <span className={styles.purposeNumber}>
                  0{index + 1}
                </span>
                <span className={styles.purposeText}>
                  <span className={styles.purposeTitle}>{purpose.title}</span>
                  <span className={styles.purposeSubtitle}>
                    {purpose.subtitle}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
