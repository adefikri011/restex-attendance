"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { authClient } from "@/lib/auth-client";
import { candidatePortalCopy } from "./candidate-portal-copy";
import styles from "./candidate-portal-shell.module.css";

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "C";
  return `${words[0][0]}${words.length > 1 ? words.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}

export function CandidatePortalShell({
  children,
  displayName,
}: {
  children: ReactNode;
  displayName: string | null;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const accountRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const signOutRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const initials = getInitials(displayName ?? "");

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    signOutRef.current?.focus();
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isMenuOpen]);

  function closeMenuAndRestoreFocus() {
    setIsMenuOpen(false);
    triggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenuAndRestoreFocus();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "Home") {
      event.preventDefault();
      signOutRef.current?.focus();
    }
    if (event.key === "ArrowUp" || event.key === "End") {
      event.preventDefault();
      signOutRef.current?.focus();
    }
  }

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError("");

    try {
      const { error } = await authClient.signOut();
      if (error) {
        console.error("Candidate portal sign out failed.", error);
        setSignOutError(candidatePortalCopy.signOutError);
        return;
      }
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Candidate portal sign out failed.", error);
      setSignOutError(candidatePortalCopy.signOutUnavailable);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className={styles.portal}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <Link className={styles.logoLink} href="/" aria-label="RESTEX, beranda">
            <Image
              src="/assets/image/logoNavbar.png"
              alt="RESTEX"
              width={40}
              height={40}
              priority
              unoptimized
            />
          </Link>

          <div className={styles.actions}>
            <ThemeSwitcher />
            {displayName ? (
              <div className={styles.account} ref={accountRef}>
                <button
                  ref={triggerRef}
                  type="button"
                  className={styles.accountTrigger}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  aria-controls={isMenuOpen ? "candidate-account-menu" : undefined}
                  onClick={() => setIsMenuOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && isMenuOpen) {
                      event.preventDefault();
                      closeMenuAndRestoreFocus();
                    }
                  }}
                >
                  <span className={styles.accountMonogram} aria-hidden="true">
                    {initials}
                  </span>
                  <span className={styles.accountName}>{displayName}</span>
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
                {isMenuOpen && (
                  <div
                    id="candidate-account-menu"
                    className={styles.accountMenu}
                    role="menu"
                    aria-label={candidatePortalCopy.accountMenu}
                    onKeyDown={handleMenuKeyDown}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setIsMenuOpen(false);
                      }
                    }}
                  >
                    <div className={styles.accountDetails}>
                      <strong>{displayName}</strong>
                      <span>{candidatePortalCopy.role}</span>
                    </div>
                    <button
                      ref={signOutRef}
                      className={styles.signOutButton}
                      type="button"
                      role="menuitem"
                      disabled={isSigningOut}
                      onClick={handleSignOut}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      {isSigningOut
                        ? candidatePortalCopy.signingOut
                        : candidatePortalCopy.signOut}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <span className={styles.headerAccountSkeleton} aria-hidden="true" />
            )}
          </div>
        </div>
      </header>
      {signOutError && (
        <p className={styles.signOutError} role="status" aria-live="polite">
          {signOutError}
        </p>
      )}
      {children}
    </div>
  );
}
