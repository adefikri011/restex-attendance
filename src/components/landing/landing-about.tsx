import styles from "./landing-about.module.css";
import { SplitLines } from "./scroll-reveal";

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
        <p className={styles.eyebrow} data-reveal="rise-sm">
          Tentang RESTEX
        </p>

        <div className={styles.introduction}>
          <h2
            className={styles.title}
            id="landing-about-title"
            data-reveal="lines"
          >
            <SplitLines>Ruang untuk mengembangkan teknologi bersama.</SplitLines>
          </h2>
          <p
            className={styles.description}
            data-reveal="rise"
            data-reveal-step="1"
          >
            RESTEX (Rekayasa Teknologi) adalah Unit Kegiatan Mahasiswa
            Universitas Nusa Putra yang bergerak di bidang riset, inovasi, dan
            pengembangan teknologi modern.
          </p>
        </div>

        <div className={styles.purposes}>
          <div className={styles.purposeHeading} data-reveal="fade">
            <span>Empat tujuan RESTEX</span>
          </div>
          <div
            className={styles.purposeLine}
            data-reveal="line-x"
            aria-hidden="true"
          />
          <ol className={styles.purposeList}>
            {purposes.map((purpose, index) => (
              <li className={styles.purposeItem} key={purpose.title}>
                {index > 0 && (
                  <span
                    className={styles.purposeDivider}
                    data-reveal="line-y"
                    data-reveal-step={index}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={styles.purposeItemBody}
                  data-reveal="rise-lg"
                  data-reveal-step={index}
                  style={
                    {
                      "--d": `${300 + index * 80}ms`,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.purposeNumber}>
                    0{index + 1}
                  </span>
                  <span className={styles.purposeText}>
                    <span className={styles.purposeTitle}>{purpose.title}</span>
                    <span className={styles.purposeSubtitle}>
                      {purpose.subtitle}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
