import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import styles from "./landing-navbar.module.css";

const futurePages = ["Artikel", "Pengumuman", "Berita", "Struktur Organisasi"];

function NavigationItems() {
  return (
    <>
      <Link href="/" className={`${styles.navItem} ${styles.activeNavItem}`} aria-current="page">
        Beranda
      </Link>
      {futurePages.map((label) => (
        <span
          className={styles.navItem}
          aria-disabled="true"
          title={`${label} akan hadir pada tahap berikutnya`}
          key={label}
        >
          {label}
          <span className={styles.comingSoon}>Segera</span>
        </span>
      ))}
    </>
  );
}

export function LandingNavbar() {
  return (
    <header className={styles.header}>
      <div className={styles.floatingPill}>
        <Link className={styles.brand} href="/" aria-label="RESTEX Attendance, beranda">
          <Image
            className={styles.logo}
            src="/assets/image/Logo.png"
            alt=""
            width={40}
            height={40}
            priority
            unoptimized
          />
          <span className={styles.brandName}>
            <strong aria-label="RESTEX">
              RESTE
              <svg
                className={styles.brandWordmarkX}
                viewBox="0 0 36 24"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="landing-brand-x-blue"
                    x1="2"
                    y1="2"
                    x2="32"
                    y2="22"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#DDF7FF" />
                    <stop offset=".48" stopColor="#69CBE8" />
                    <stop offset="1" stopColor="#3186B6" />
                  </linearGradient>
                  <linearGradient
                    id="landing-brand-x-rose"
                    x1="3"
                    y1="23"
                    x2="34"
                    y2="2"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#E84F70" />
                    <stop offset="1" stopColor="#FF8294" />
                  </linearGradient>
                </defs>
                <path
                  d="M1.5 1C8 3.4 14.7 9 21 13.8L35 23.5C28.2 21.6 21.5 16 15.2 11.2L1.5 1Z"
                  fill="url(#landing-brand-x-blue)"
                />
                <path
                  d="M.6 23.3C6.5 18.5 13.5 12.9 20.5 7.6 26.4 3.2 31.8.8 35.7.2 32.3 3.2 27.9 7 22.1 11.8 15.8 17 8.8 22.3 3.1 23.8 2.1 24.1 1.2 23.9.6 23.3Z"
                  fill="url(#landing-brand-x-rose)"
                />
              </svg>
            </strong>
            <small>ATTENDANCE</small>
          </span>
        </Link>

        <nav className={styles.desktopNavigation} aria-label="Navigasi utama">
          <NavigationItems />
        </nav>

        <Link className={styles.loginLink} href="/login">
          Masuk
        </Link>

        <details className={styles.mobileMenu}>
          <summary aria-label="Buka menu navigasi">
            <Menu size={19} aria-hidden="true" />
          </summary>
          <nav className={styles.mobileNavigation} aria-label="Navigasi utama">
            <NavigationItems />
            <Link className={styles.mobileLoginLink} href="/login">
              Masuk ke akun
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
