import type { Officer } from "@/data/structure";
import { OfficerCard } from "./officer-card";
import styles from "./officer-rack.module.css";

export function OfficerRack({ officers }: { officers: Officer[] }) {
  if (officers.length === 0) return null;

  return (
    <div className={styles.rack}>
      <div className={styles.rail} aria-hidden="true" data-reveal="line-x" />
      <ul className={styles.officers} role="list">
        {officers.map((officer, index) => (
          <li className={styles.officer} key={officer.id}>
            <span
              className={styles.rope}
              aria-hidden="true"
              data-reveal="rope"
              data-reveal-step={index}
            />
            <OfficerCard officer={officer} step={index} />
          </li>
        ))}
      </ul>
    </div>
  );
}
