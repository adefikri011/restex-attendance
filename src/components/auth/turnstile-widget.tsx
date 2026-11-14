"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import styles from "./turnstile-widget.module.css";

type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  theme: "light";
  size: "flexible";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: TurnstileRenderOptions,
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  action?: string;
};

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export const TurnstileWidget = forwardRef<
  TurnstileWidgetHandle,
  TurnstileWidgetProps
>(function TurnstileWidget({ onTokenChange, action = "login" }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        const widgetId = widgetIdRef.current;
        if (widgetId && window.turnstile) {
          window.turnstile.reset(widgetId);
        }
        onTokenChangeRef.current(null);
      },
    }),
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;

    if (!siteKey || !scriptReady || !container || !turnstile) {
      return;
    }

    const widgetId = turnstile.render(container, {
      sitekey: siteKey,
      action,
      theme: "light",
      size: "flexible",
      callback: (token) => {
        setError("");
        onTokenChangeRef.current(token);
      },
      "expired-callback": () => {
        onTokenChangeRef.current(null);
        setError("Verifikasi kedaluwarsa. Silakan verifikasi kembali.");
      },
      "error-callback": () => {
        onTokenChangeRef.current(null);
        setError("Verifikasi gagal dimuat. Periksa koneksi lalu coba lagi.");
      },
    });

    widgetIdRef.current = widgetId;

    return () => {
      turnstile.remove(widgetId);
      widgetIdRef.current = null;
    };
  }, [action, scriptReady]);

  return (
    <div className={styles.captcha}>
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
          onError={() => {
            setError("Verifikasi gagal dimuat. Periksa koneksi lalu coba lagi.");
          }}
        />
      )}
      <div
        ref={containerRef}
        className={styles.widget}
        role="group"
        aria-label="Verifikasi keamanan Cloudflare"
      />
      <p className={styles.status} role="status" aria-live="polite">
        {!siteKey
          ? "Verifikasi keamanan belum dikonfigurasi."
          : error}
      </p>
    </div>
  );
});
