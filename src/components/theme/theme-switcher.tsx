"use client";

import { Check, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useSyncExternalStore } from "react";
import { themeOptions } from "./theme-config";
import styles from "./theme-switcher.module.css";

const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const isMounted = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot,
  );

  const activeTheme = isMounted
    ? themeOptions.find((option) => option.name === theme)
    : undefined;
  const CurrentIcon = activeTheme?.icon ?? Sun;

  return (
    <details className={styles.switcher} ref={menuRef}>
      <summary
        className={styles.trigger}
        aria-label={
          activeTheme
            ? `Tema saat ini ${activeTheme.label}; pilih tema`
            : "Memuat pengaturan tema"
        }
        title="Pengaturan tema"
      >
        <CurrentIcon size={18} strokeWidth={1.8} aria-hidden="true" />
      </summary>
      <div className={styles.menu}>
        <span className={styles.menuLabel}>TAMPILAN</span>
        {themeOptions.map(({ name, label, icon: Icon }) => {
          const isSelected = isMounted && theme === name;

          return (
            <button
              type="button"
              key={name}
              className={`${styles.option} ${
                isSelected ? styles.selectedOption : ""
              }`}
              aria-pressed={isSelected}
              onClick={() => {
                setTheme(name);
                menuRef.current?.removeAttribute("open");
              }}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{label}</span>
              {isSelected && <Check size={15} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </details>
  );
}
