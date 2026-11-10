"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { authClient } from "@/lib/auth-client";
import styles from "./login-page.module.css";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setIsSubmitting(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        rememberMe: remember,
      });

      if (error || !data) {
        setNotice("Email atau kata sandi tidak valid. Silakan coba lagi.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
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
              <strong>RESTE<span>X</span></strong>
              <small>ATTENDANCE</small>
            </span>
          </Link>

          <div className={styles.brandMessage}>
            <span className={styles.brandEyebrow}>
              <span aria-hidden="true" />
              RUANG KERJA RESTEX
            </span>
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
        <div className={styles.topActions}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={15} aria-hidden="true" />
            Kembali
          </Link>
          <ThemeSwitcher />
        </div>

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
              <strong>RESTE<span>X</span></strong>
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
                    <CheckCircle2 size={12} />
                  </span>
                  Ingat saya
                </label>
                <span className={styles.forgotHelp}>Lupa sandi? Hubungi Admin.</span>
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
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
