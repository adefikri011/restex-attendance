import { CandidatePortalShell } from "@/components/recruitment/candidate-portal-shell";
import { CandidatePortalSkeleton } from "@/components/recruitment/candidate-announcement";
import pageStyles from "./page.module.css";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <CandidatePortalShell displayName={null}>
      <main className={pageStyles.main}>
        <div className={`${pageStyles.heading} ${styles.heading}`} aria-hidden="true">
          <span className={styles.title} />
          <span className={styles.lead} />
        </div>
        <CandidatePortalSkeleton />
      </main>
    </CandidatePortalShell>
  );
}
