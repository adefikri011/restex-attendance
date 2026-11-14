import type { Metadata } from "next";
import { CandidateAnnouncement } from "@/components/recruitment/candidate-announcement";
import { CandidateMeetingChoice } from "@/components/recruitment/candidate-meeting-choice";
import { candidatePortalCopy } from "@/components/recruitment/candidate-portal-copy";
import { CandidatePortalShell } from "@/components/recruitment/candidate-portal-shell";
import { requirePageUser } from "@/lib/auth-guard";
import { getCandidateMeetingData } from "@/lib/recruitment-meeting-service";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Portal Calon Anggota | RESTEX",
  description: "Pantau perkembangan seleksi calon anggota RESTEX.",
};

export const instant = false;

export default async function CandidatePortalRoute() {
  const user = await requirePageUser(["calon-anggota"]);
  let application: Awaited<ReturnType<typeof getCandidateMeetingData>> = null;
  let status: "ready" | "error" = "ready";

  try {
    application = await getCandidateMeetingData(user.id);
  } catch (error) {
    console.error("Candidate application status failed to load.", error);
    status = "error";
  }

  const updatedAt = application?.updatedAt.toISOString() ?? null;
  const updatedAtLabel = application
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(application.updatedAt) +
      `, ${candidatePortalCopy.timePrefix} ${new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: "Asia/Jakarta",
      }).format(application.updatedAt)}`
    : null;

  return (
    <CandidatePortalShell displayName={user.name}>
      <main className={styles.main}>
        <header className={styles.heading}>
          <h1>{candidatePortalCopy.pageTitle} {user.name}.</h1>
          <p>{candidatePortalCopy.pageLead}</p>
        </header>
        <CandidateAnnouncement
          displayName={user.name}
          status={status}
          stage={application?.stage ?? null}
          decision={application?.decision ?? null}
          updatedAt={updatedAt}
          updatedAtLabel={updatedAtLabel}
        />
        {status === "ready" &&
          application?.stage === "MEETING_INVITED" &&
          !application.decision && (
            <CandidateMeetingChoice meeting={application} />
          )}
      </main>
    </CandidatePortalShell>
  );
}
