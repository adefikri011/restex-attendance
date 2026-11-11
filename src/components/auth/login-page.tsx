"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  AtSign,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { LoginMascot } from "./login-mascot";
import { TurnstileWidget, type TurnstileWidgetHandle } from "./turnstile-widget";
import styles from "./login-page.module.css";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (!captchaToken) {
      setNotice("Selesaikan verifikasi keamanan sebelum masuk.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await authClient.signIn.email(
        {
          email: email.trim().toLowerCase(),
          password,
          rememberMe: remember,
        },
        {
          headers: { "x-captcha-response": captchaToken },
        },
      );

      if (error || !data) {
        turnstileRef.current?.reset();
        setNotice(
          error?.code === "VERIFICATION_FAILED" ||
            error?.code === "MISSING_RESPONSE"
            ? "Verifikasi keamanan gagal. Silakan coba kembali."
            : "Email atau kata sandi tidak valid. Silakan coba lagi.",
        );
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      turnstileRef.current?.reset();
      setNotice("Layanan login tidak dapat dihubungi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.brandPanel} aria-label="RESTEX Attendance">
        <div className={styles.brandGlow} aria-hidden="true" />
        <div className={styles.brandContent}>
          <LoginMascot />
          <Link className={styles.brandLink} href="/" aria-label="RESTEX Attendance">
            <Image
              className={styles.brandLogo}
              src="/assets/image/Logo.png"
              alt=""
              width={48}
              height={48}
              priority
              unoptimized
            />
            <span className={styles.wordmark}>
              <strong>
                RESTE
                <svg
                  className={styles.wordmarkX}
                  viewBox="0 0 36 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="login-brand-x-blue" x1="2" y1="2" x2="32" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#DDF7FF" />
                      <stop offset=".48" stopColor="#69CBE8" />
                      <stop offset="1" stopColor="#3186B6" />
                    </linearGradient>
                    <linearGradient id="login-brand-x-rose" x1="3" y1="23" x2="34" y2="2" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E84F70" />
                      <stop offset="1" stopColor="#FF8294" />
                    </linearGradient>
                  </defs>
                  <path d="M1.5 1C8 3.4 14.7 9 21 13.8L35 23.5C28.2 21.6 21.5 16 15.2 11.2L1.5 1Z" fill="url(#login-brand-x-blue)" />
                  <path d="M.6 23.3C6.5 18.5 13.5 12.9 20.5 7.6 26.4 3.2 31.8.8 35.7.2 32.3 3.2 27.9 7 22.1 11.8 15.8 17 8.8 22.3 3.1 23.8 2.1 24.1 1.2 23.9.6 23.3Z" fill="url(#login-brand-x-rose)" />
                </svg>
              </strong>
              <small>ATTENDANCE</small>
            </span>
          </Link>

          <div className={styles.brandMessage}>
            <h1>
              Hadir untuk
              <br />
              setiap langkah
              <span>.</span>
            </h1>
            <p>
              Ruang bersama untuk pengurus dan anggota mengelola kegiatan serta
              mengikuti perjalanan kehadiran di RESTEX.
            </p>
          </div>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <span><UserRoundCheck size={17} aria-hidden="true" /></span>
              <div>
                <strong>Akses sesuai peran</strong>
                <small>Hak akses teratur untuk setiap pengurus.</small>
              </div>
            </div>
            <div className={styles.featureItem}>
              <span><ShieldCheck size={17} aria-hidden="true" /></span>
              <div>
                <strong>Data anggota terjaga</strong>
                <small>Riwayat dan aktivitas tercatat dengan rapi.</small>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.brandFooter}>
          <span>UKM Rekayasa Teknologi</span>
          <span>Universitas Nusa Putra</span>
        </div>
        <span className={styles.decorativeMark} aria-hidden="true">X</span>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.loginContent}>
          <div className={styles.mobileBrand}>
            <Image
              src="/assets/image/Logo.png"
              alt=""
              width={42}
              height={42}
              unoptimized
            />
            <span>
              <strong>
                RESTE
                <svg
                  className={styles.wordmarkX}
                  viewBox="0 0 36 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="login-mobile-x-blue" x1="2" y1="2" x2="32" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#DDF7FF" />
                      <stop offset=".48" stopColor="#69CBE8" />
                      <stop offset="1" stopColor="#3186B6" />
                    </linearGradient>
                    <linearGradient id="login-mobile-x-rose" x1="3" y1="23" x2="34" y2="2" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#E84F70" />
                      <stop offset="1" stopColor="#FF8294" />
                    </linearGradient>
                  </defs>
                  <path d="M1.5 1C8 3.4 14.7 9 21 13.8L35 23.5C28.2 21.6 21.5 16 15.2 11.2L1.5 1Z" fill="url(#login-mobile-x-blue)" />
                  <path d="M.6 23.3C6.5 18.5 13.5 12.9 20.5 7.6 26.4 3.2 31.8.8 35.7.2 32.3 3.2 27.9 7 22.1 11.8 15.8 17 8.8 22.3 3.1 23.8 2.1 24.1 1.2 23.9.6 23.3Z" fill="url(#login-mobile-x-rose)" />
                </svg>
              </strong>
              <small>ATTENDANCE</small>
            </span>
          </div>

          <div className={styles.formHeading}>
            <span className={styles.formEyebrow}>SELAMAT DATANG KEMBALI</span>
            <h2>Masuk ke akun</h2>
            <p>Masuk dengan kredensial akun RESTEX Attendance.</p>
          </div>

          <p className={styles.liveNotice} role="status" aria-live="polite">
            {notice}
          </p>

          <section className={styles.credentialsPanel}>
            <form className={styles.loginForm} onSubmit={handleLogin}>
              <label className={styles.formLabel}>
                Email
                <span className={styles.inputWrap}>
                  <AtSign size={16} aria-hidden="true" />
                  <input
                    autoComplete="username"
                    autoFocus
                    required
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setNotice("");
                    }}
                    placeholder="nama@restex.id"
                  />
                </span>
              </label>

              <label className={styles.formLabel}>
                Kata sandi
                <span className={styles.inputWrap}>
                  <LockKeyhole size={16} aria-hidden="true" />
                  <input
                    autoComplete="current-password"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan kata sandi"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} aria-hidden="true" />
                    ) : (
                      <Eye size={16} aria-hidden="true" />
                    )}
                  </button>
                </span>
              </label>

              <div className={styles.formOptions}>
                <label className={styles.rememberOption}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  <span className={styles.customCheckbox} aria-hidden="true">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  Ingat saya
                </label>
                <span className={styles.forgotHelp}>Lupa sandi? Hubungi Admin.</span>
              </div>

              <TurnstileWidget
                ref={turnstileRef}
                onTokenChange={setCaptchaToken}
              />

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !captchaToken}
              >
                {isSubmitting ? "Memeriksa..." : "Masuk"}
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </form>

            <div className={styles.loginInfo}>
              <ShieldCheck size={15} aria-hidden="true" />
              <span>
                Role ditentukan otomatis dari akun aktif. Jika belum memiliki
                akses, hubungi administrator RESTEX.
              </span>
            </div>
          </section>

          <p className={styles.securityNote}>
            Sesi login diverifikasi oleh server. Akses setiap halaman dibatasi
            berdasarkan role akun.
          </p>
        </div>

        <footer className={styles.formFooter}>
          <span>© 2026 RESTEX Attendance</span>
          <span>Teknologi untuk kebersamaan.</span>
        </footer>
      </section>
    </main>
  );
}
