import Link from "next/link";
import { LANDING_PROJECTS, type LandingProject } from "./landing-project-data";
import styles from "./landing-projects.module.css";

function ProjectArtwork({ visual }: { visual: LandingProject["visual"] }) {
  const visualLabel = {
    environment: "pemantauan kualitas ruang",
    robotics: "robot navigasi mandiri",
    agriculture: "kebun pintar berbasis sensor",
  }[visual];

  return (
    <svg
      className={styles.artwork}
      viewBox="0 0 640 420"
      fill="none"
      role="img"
      aria-label={`Ilustrasi konsep ${visualLabel}`}
    >
      <path className={styles.gridLine} d="M0 70h640M0 140h640M0 210h640M0 280h640M0 350h640M80 0v420M160 0v420M240 0v420M320 0v420M400 0v420M480 0v420M560 0v420" />
      {visual === "environment" && (
        <>
          <path className={styles.trace} d="M95 120h104v70h80m186-94h64v76" />
          <path className={styles.trace} d="M118 294h86v-44h75m179 77h58v-60" />
          <rect className={styles.board} x="278" y="126" width="172" height="170" rx="14" />
          <rect className={styles.chip} x="324" y="172" width="80" height="72" rx="8" />
          <path className={styles.pin} d="M342 160v12m20-12v12m20-12v12m-40 72v12m20-12v12m20-12v12m-56-60h18m62 0h18m-98 20h18m62 0h18" />
          <circle className={styles.signal} cx="95" cy="120" r="8" />
          <circle className={styles.signal} cx="529" cy="96" r="8" />
          <circle className={styles.node} cx="118" cy="294" r="8" />
          <circle className={styles.signal} cx="516" cy="327" r="8" />
          <rect className={styles.readout} x="450" y="226" width="122" height="66" rx="8" />
          <path className={styles.readoutLine} d="M467 270h20l12-24 14 31 12-17h29" />
        </>
      )}
      {visual === "robotics" && (
        <>
          <path className={styles.trace} d="M134 315h372M205 315l45-76 76 18 74-103 39 15" />
          <circle className={styles.joint} cx="250" cy="239" r="21" />
          <circle className={styles.joint} cx="326" cy="257" r="21" />
          <circle className={styles.joint} cx="400" cy="154" r="21" />
          <path className={styles.robotArm} d="m250 239 76 18 74-103 39 15" />
          <path className={styles.robotArm} d="m439 169 26 10 16-22m-16 22 17 20" />
          <path className={styles.traceMuted} d="M146 119h99m-99 18h66m186 198h100" />
          <circle className={styles.signal} cx="466" cy="179" r="8" />
          <rect className={styles.readout} x="102" y="92" width="105" height="48" rx="7" />
        </>
      )}
      {visual === "agriculture" && (
        <>
          <path className={styles.trace} d="M100 324h440M320 324V186m0 64c-4-48-34-72-80-76 2 44 31 72 80 76Zm0-29c8-52 41-77 91-78-5 47-36 75-91 78Z" />
          <path className={styles.traceMuted} d="M180 324v-55m280 55v-55" />
          <path className={styles.soil} d="M178 324c36-24 72-24 108 0m107 0c36-24 72-24 108 0" />
          <circle className={styles.signal} cx="320" cy="186" r="9" />
          <circle className={styles.node} cx="196" cy="269" r="8" />
          <circle className={styles.node} cx="462" cy="269" r="8" />
          <rect className={styles.readout} x="378" y="91" width="128" height="54" rx="7" />
          <path className={styles.readoutLine} d="M397 119h20l11-12 13 22 13-16h28" />
        </>
      )}
    </svg>
  );
}

function ProjectCard({
  project,
  featured = false,
}: {
  project: LandingProject;
  featured?: boolean;
}) {
  return (
    <article
      className={`${styles.projectCard} ${featured ? styles.featured : ""}`}
    >
      <div className={styles.projectVisual}>
        <ProjectArtwork visual={project.visual} />
        <span className={styles.previewLabel}>Contoh konsep</span>
      </div>
      <div className={styles.projectCopy}>
        <p className={styles.projectDivision}>{project.division}</p>
        <h3 className={styles.projectTitle}>{project.title}</h3>
        <p className={styles.projectDescription}>{project.description}</p>
      </div>
    </article>
  );
}

export function LandingProjects() {
  const [featuredProject, ...otherProjects] = LANDING_PROJECTS;

  if (!featuredProject) return null;

  return (
    <section
      className={styles.section}
      id="karya"
      aria-labelledby="landing-projects-title"
    >
      <div className={`${styles.content} site-container`}>
        <header className={styles.header}>
          <div className={styles.headingCopy}>
            <p className={styles.eyebrow}>Karya dan proyek</p>
            <h2 className={styles.title} id="landing-projects-title">
              Gagasan yang dirancang menjadi teknologi.
            </h2>
          </div>
          <p className={styles.introduction}>
            Lihat contoh konsep untuk portofolio riset, prototipe, dan karya
            anggota RESTEX.
          </p>
        </header>

        <ProjectCard project={featuredProject} featured />

        {otherProjects.length > 0 && (
          <div className={styles.projectGrid}>
            {otherProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        )}

        <footer className={styles.footer}>
          <p>Dokumentasi proyek resmi dapat ditambahkan saat sudah tersedia.</p>
          <Link className={styles.divisionLink} href="#divisi">
            Jelajahi divisi
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4.5 12h14m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </footer>
      </div>
    </section>
  );
}
