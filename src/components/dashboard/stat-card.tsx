import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import styles from "./dashboard.module.css";

type StatCardProps = {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  tone: "navy" | "green" | "rose" | "amber";
  trend?: string;
};

export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  trend,
}: StatCardProps) {
  return (
    <article className={styles.statCard}>
      <div className={styles.statTopline}>
        <span className={`${styles.statIcon} ${styles[tone]}`}>
          <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
        </span>
        {trend && (
          <span className={styles.statTrend}>
            <ArrowUpRight size={14} aria-hidden="true" />
            {trend}
          </span>
        )}
      </div>
      <p className={styles.statLabel}>{label}</p>
      <div className={styles.statValue}>{value}</div>
      <p className={styles.statCaption}>{caption}</p>
    </article>
  );
}
