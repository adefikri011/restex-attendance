import type { Officer } from "@/data/structure";
import { OfficerCard } from "./officer-card";
import styles from "./officer-rack.module.css";

export function OfficerRack({ officers }: { officers: Officer[] }) {
  if (officers.length === 0) return null;

  return (
    <div className={styles.rack}>
      <div className={styles.rail} aria-hidden="true" />
      <ul className={styles.officers} role="list">
        {officers.map((officer) => (
          <li className={styles.officer} key={officer.id}>
            <OfficerCard officer={officer} />
          </li>
        ))}
      </ul>
    </div>
  );
}
