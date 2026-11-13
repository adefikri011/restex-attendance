import Image from "next/image";
import type { Officer } from "@/data/structure";
import styles from "./officer-card.module.css";

function getMonogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1]?.[0] ?? "" : first;

  return `${first}${last}`.toLocaleUpperCase("id");
}

export function OfficerPortrait({
  officer,
  compact = false,
}: {
  officer: Officer;
  compact?: boolean;
}) {
  const frameClass = compact ? styles.avatarFrame : styles.photoFrame;
  const fallbackClass = compact
    ? styles.avatarPlaceholder
    : styles.monogramFrame;
  const monogramClass = compact ? styles.avatarMonogram : styles.monogram;

  if (officer.photo) {
    return (
      <div className={frameClass}>
        <Image
          className={styles.photo}
          src={officer.photo}
          alt=""
          width={400}
          height={500}
          sizes={compact ? "56px" : "(min-width:1024px) 280px, 45vw"}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`${frameClass} ${fallbackClass}`}>
      <span className={monogramClass} aria-hidden="true">
        {getMonogram(officer.name)}
      </span>
    </div>
  );
}

export function OfficerCard({ officer }: { officer: Officer }) {
  return (
    <article className={styles.card}>
      <span className={styles.hanger} aria-hidden="true" />
      <OfficerPortrait officer={officer} />
      <div className={styles.copy}>
        <p className={styles.position}>{officer.position}</p>
        <h3 className={styles.name}>{officer.name}</h3>
      </div>
    </article>
  );
}
