"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LANDING_NAVIGATION_ITEMS } from "./landing-navigation";
import styles from "./landing-navbar.module.css";

function isCurrentPage(href: string, pathname: string) {
  if (!href.startsWith("/")) return false;
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function NavigationItems({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <>
      {LANDING_NAVIGATION_ITEMS
        .filter((item) => item.enabled)
        .map((item) => (
          <Link
            href={item.href}
            className={`${styles.navItem} ${
              isCurrentPage(item.href, pathname) ? styles.activeNavItem : ""
            }`}
            aria-current={
              isCurrentPage(item.href, pathname) ? "page" : undefined
            }
            onClick={onNavigate}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
    </>
  );
}

export function LandingNavbar() {
  const pathname = usePathname() ?? "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isCollapsed = isScrolled && !isExpanded;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateViewport = () => setIsDesktop(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    let wasScrolled = false;
    const handleScroll = () => {
      const scrolled = window.scrollY > 24;
      setIsScrolled(scrolled);

      if (scrolled !== wasScrolled) {
        setIsExpanded(false);
        setIsMobileMenuOpen(false);
        wasScrolled = scrolled;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if ((!isScrolled || !isExpanded) && !isMobileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsExpanded(false);
        setIsMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded, isMobileMenuOpen, isScrolled]);

  const handleBrandClick = () => {
    if (isScrolled) {
      setIsExpanded(!isExpanded);
      if (!isExpanded) setIsMobileMenuOpen(false);
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const collapseAfterNavigation = () => setIsExpanded(false);
  const closeMobileNavigation = () => {
    setIsMobileMenuOpen(false);
    setIsExpanded(false);
  };

  return (
    <header
      className={styles.header}
      ref={headerRef}
      data-collapsed={isCollapsed}
    >
      <div className={`${styles.floatingPill} site-container`}>
        <button
          className={styles.brand}
          type="button"
          onClick={handleBrandClick}
          aria-label={
            isScrolled
              ? isExpanded
                ? "Ciutkan navigasi"
                : "Buka navigasi utama"
              : "Kembali ke bagian atas"
          }
          aria-expanded={isScrolled ? !isCollapsed : undefined}
          aria-controls={isDesktop ? "landing-desktop-navigation" : undefined}
          title={isCollapsed ? "Buka navigasi" : undefined}
        >
          <Image
            className={styles.logo}
            src="/assets/image/logoNavbar.png"
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
            <small>REKAYASA TEKNOLOGI</small>
          </span>
        </button>

        <nav
          className={styles.desktopNavigation}
          id="landing-desktop-navigation"
          aria-label="Navigasi utama"
          inert={isCollapsed}
        >
          <NavigationItems
            onNavigate={collapseAfterNavigation}
            pathname={pathname}
          />
        </nav>

        <Link
          className={styles.loginLink}
          href="/login"
          tabIndex={isCollapsed ? -1 : undefined}
        >
          Masuk
        </Link>

        <div
          className={styles.mobileMenu}
          ref={mobileMenuRef}
          data-open={isMobileMenuOpen}
        >
          <button
            className={styles.menuToggle}
            type="button"
            aria-label={
              isMobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-navigation"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span className={styles.menuGlyph} aria-hidden="true">
              <span />
              <span />
            </span>
            <span className={styles.menuLabel}>
              {isMobileMenuOpen ? "TUTUP" : "MENU"}
            </span>
          </button>
          <nav
            className={styles.mobileNavigation}
            id="landing-mobile-navigation"
            aria-label="Navigasi utama"
            aria-hidden={!isMobileMenuOpen}
            inert={!isMobileMenuOpen}
          >
            <div className={styles.mobileMenuHeading}>
              <span>RESTEX / NAVIGASI</span>
              <span>JELAJAHI</span>
            </div>
            <ol className={styles.mobileNavList}>
              {LANDING_NAVIGATION_ITEMS.filter((item) => item.enabled).map(
                (item, index) => {
                  const isActive = isCurrentPage(item.href, pathname);
                  return (
                    <li key={item.label}>
                      <Link
                        className={`${styles.mobileNavLink} ${
                          isActive ? styles.activeMobileNavLink : ""
                        }`}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={closeMobileNavigation}
                      >
                        <span className={styles.mobileNavNumber}>
                          0{index + 1}
                        </span>
                        <span>{item.label}</span>
                        <span
                          className={styles.mobileNavArrow}
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                      </Link>
                    </li>
                  );
                },
              )}
            </ol>
          </nav>
        </div>
      </div>
    </header>
  );
}
