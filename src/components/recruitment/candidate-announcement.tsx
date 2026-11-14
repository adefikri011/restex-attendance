"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Clock3 } from "lucide-react";
import { useState } from "react";
import type {
  ApplicantDecision,
  ApplicantStage,
} from "@/generated/prisma/client";
import { candidatePortalCopy, getCandidateStageIndex } from "./candidate-portal-copy";
import styles from "./candidate-announcement.module.css";

type CandidateAnnouncementProps = {
  displayName: string;
  status: "ready" | "error";
  stage: ApplicantStage | null;
  decision: ApplicantDecision | null;
  updatedAt: string | null;
  updatedAtLabel: string | null;
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return `${words[0][0]}${words.length > 1 ? words.at(-1)?.[0] ?? "" : ""}`.toUpperCase();
}

function CandidateLanyard({
  displayName,
  isAccepted,
}: {
  displayName: string;
  isAccepted: boolean;
}) {
  return (
    <>
      <aside className={styles.lanyard} aria-label={`Kartu calon anggota ${displayName}`}>
        <div className={styles.hangingHole} aria-hidden="true" />
        <div className={styles.lanyardPhoto} aria-hidden="true">
          <span>{getInitials(displayName)}</span>
        </div>
        <div className={styles.lanyardIdentity}>
          <p className={styles.lanyardName}>{displayName}</p>
          <p className={styles.lanyardRole}>
            {isAccepted ? candidatePortalCopy.acceptedRole : candidatePortalCopy.role}
          </p>
        </div>
        <div className={styles.lanyardQr} aria-hidden="true">
          {isAccepted ? candidatePortalCopy.qrAccepted : candidatePortalCopy.qrPending}
        </div>
      </aside>
    </>
  );
}

export function CandidateAnnouncement({
  displayName,
  status,
  stage,
  decision,
  updatedAt,
  updatedAtLabel,
}: CandidateAnnouncementProps) {
  const router = useRouter();
  const [isResultRevealed, setIsResultRevealed] = useState(false);

  const stageIndex = stage ? getCandidateStageIndex(stage) : -1;
  const activeStage = candidatePortalCopy.stages[stageIndex];
  const result = decision ? candidatePortalCopy.result[decision] : null;
  const isAccepted = decision === "ACCEPTED";
  const nextStage = !decision && stageIndex >= 0
    ? candidatePortalCopy.stages[stageIndex + 1]
    : undefined;

  return (
    <div className={styles.portalGrid}>
      <CandidateLanyard displayName={displayName} isAccepted={isAccepted} />
      <div className={styles.statusColumn}>
        {status === "error" ? (
          <section className={styles.messageState} aria-live="polite">
            <p>{candidatePortalCopy.loadError}</p>
            <button type="button" className={styles.retryButton} onClick={() => router.refresh()}>
              {candidatePortalCopy.retry}
            </button>
          </section>
        ) : !stage || !activeStage ? (
          <section className={styles.messageState} aria-live="polite">
            <p>{candidatePortalCopy.emptyStatus}</p>
          </section>
        ) : (
          <>
            <section className={styles.statusPanel} aria-labelledby="current-stage-title">
              {result ? (
                isResultRevealed ? (
                  <div className={styles.revealedResult}>
                    <div className={styles.resultText}>
                      <p className={styles.stageCount}>{candidatePortalCopy.resultHeading}</p>
                      <h2
                        className={`${styles.resultTitle} ${isAccepted ? styles.acceptedTitle : ""}`}
                        id="current-stage-title"
                      >
                        {isAccepted && (
                          <Check className={styles.acceptedCheck} size={22} strokeWidth={2.5} aria-hidden="true" />
                        )}
                        {result.title}
                      </h2>
                      {result.message && <p className={styles.resultMessage}>{result.message}</p>}
                    </div>
                    <Image
                      className={styles.resultMascot}
                      src={isAccepted ? "/assets/mascot/floating-done.webp" : "/assets/mascot/floating-guide.webp"}
                      alt=""
                      width={180}
                      height={180}
                      unoptimized
                    />
                  </div>
                ) : (
                  <>
                    <p className={styles.stageCount}>{candidatePortalCopy.resultHeading}</p>
                    <h2 id="current-stage-title">{candidatePortalCopy.publishedResult}</h2>
                    <button
                      className={styles.openResultButton}
                      type="button"
                      onClick={() => setIsResultRevealed(true)}
                    >
                      {candidatePortalCopy.openAnnouncement} <ArrowUpRight size={17} aria-hidden="true" />
                    </button>
                  </>
                )
              ) : (
                <>
                  <p className={styles.stageCount}>
                    {candidatePortalCopy.selectionProgress} {stageIndex + 1} {candidatePortalCopy.of} {candidatePortalCopy.stages.length}
                  </p>
                  <h2 id="current-stage-title">{activeStage.title}</h2>
                  {"description" in activeStage && activeStage.description && (
                    <p className={styles.stageDescription}>{activeStage.description}</p>
                  )}
                  {nextStage && (
                    <p className={styles.nextStage}>
                      <span>{candidatePortalCopy.nextStage}</span> <strong>{nextStage.title}</strong>
                    </p>
                  )}
                  {updatedAt && updatedAtLabel && (
                    <p className={styles.updatedAt}>
                      {candidatePortalCopy.lastUpdated}{" "}
                      <time dateTime={updatedAt}>{updatedAtLabel} {candidatePortalCopy.timezone}</time>
                    </p>
                  )}
                </>
              )}
            </section>

            <ol className={styles.timeline} aria-label="Tahapan seleksi">
              {candidatePortalCopy.stages.map((item, index) => {
                const isCurrent = !decision && index === stageIndex;
                const isComplete = Boolean(decision) || index < stageIndex;
                const isUpcoming = !isCurrent && !isComplete;

                return (
                  <li
                    key={item.id}
                    className={[
                      styles.timelineItem,
                      isCurrent ? styles.current : "",
                      isComplete ? styles.complete : "",
                      isUpcoming ? styles.upcoming : "",
                    ].join(" ")}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    <span className={styles.markerColumn} aria-hidden="true">
                      <span className={styles.marker}>
                        {item.id === "ANNOUNCEMENT" && !decision ? (
                          <Clock3 size={14} />
                        ) : isComplete ? (
                          <Check size={14} strokeWidth={2.5} />
                        ) : isCurrent ? (
                          <span className={styles.currentDot} />
                        ) : index === candidatePortalCopy.stages.length - 1 ? (
                          <Clock3 size={14} />
                        ) : null}
                      </span>
                    </span>
                    <span className={styles.timelineContent}>
                      <span className={styles.timelineTitleRow}>
                        <strong>{item.title}</strong>
                      </span>
                      {isCurrent && "timelineDescription" in item && (
                        <span className={styles.timelineDescription}>
                          {item.timelineDescription}
                        </span>
                      )}
                      <span className={styles.visuallyHidden}>
                        {isCurrent
                          ? candidatePortalCopy.currentStageSr
                          : isComplete
                            ? candidatePortalCopy.completeStageSr
                            : candidatePortalCopy.futureStageSr}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

export function CandidatePortalSkeleton() {
  return (
    <div className={`${styles.portalGrid} ${styles.skeleton}`} aria-hidden="true">
      <div className={styles.skeletonCard}>
        <span className={styles.skeletonPhoto} />
        <span className={styles.skeletonLine} />
        <span className={styles.skeletonLineShort} />
        <span className={styles.skeletonQr} />
      </div>
      <div className={styles.skeletonContent}>
        <span className={styles.skeletonLineShort} />
        <span className={styles.skeletonTitle} />
        <span className={styles.skeletonLine} />
        <span className={styles.skeletonLineShort} />
        <ol>
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <span />
              <span className={styles.skeletonLine} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
