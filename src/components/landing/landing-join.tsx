import Link from "next/link";
import type {
  RecruitmentSettings,
  RecruitmentStatus,
} from "@/lib/recruitment";
import { formatTanggal, RECRUITMENT } from "@/lib/recruitment";
import styles from "./landing-join.module.css";

function isInternalUrl(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function isHttpsUrl(href: string) {
  return /^https:\/\//i.test(href);
}

function ExternalArrow() {
  return (
    <svg
      className={styles.externalArrow}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 3.5h7.5V11M12.25 3.75 4 12m6-4v4H3.5v-8h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function RecruitmentButton({
  href,
  label,
  external = false,
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const content = (
    <>
      {label}
      {external && (
        <>
          <ExternalArrow />
          <span className="sr-only">(membuka tab baru)</span>
        </>
      )}
    </>
  );

  if (!external && isInternalUrl(href)) {
    return (
      <Link className={styles.primaryButton} href={href}>
        {content}
      </Link>
    );
  }

  if (isHttpsUrl(href)) {
    return (
      <a
        className={styles.primaryButton}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return null;
}

function getStatusLabel(status: RecruitmentStatus) {
  if (status.state === "open") return "Pendaftaran dibuka";
  if (status.state === "upcoming") return "Oprec belum dibuka";
  return "Oprec periode ini sudah ditutup";
}

function getAccessibleStatus(status: RecruitmentStatus) {
  if (status.state === "open") {
    if (status.daysLeft === 0) return "Pendaftaran dibuka, ditutup hari ini.";
    if (status.daysLeft !== undefined && status.closesAt) {
      return `Pendaftaran dibuka, ${status.daysLeft} hari lagi, ditutup ${formatTanggal(status.closesAt)}.`;
    }
    return "Pendaftaran dibuka.";
  }

  if (status.state === "upcoming") {
    return status.opensAt
      ? `Oprec belum dibuka, dibuka ${formatTanggal(status.opensAt)}.`
      : "Oprec belum dibuka.";
  }

  return status.closesAt
    ? `Oprec periode ini sudah ditutup pada ${formatTanggal(status.closesAt)}.`
    : "Oprec periode ini sudah ditutup.";
}

function StatusPanel({
  status,
  settings,
}: {
  status: RecruitmentStatus;
  settings: RecruitmentSettings;
}) {
  const registerUrl = settings.registerUrl.trim();
  const notifyUrl = settings.notifyUrl.trim();
  const canRegister =
    status.state === "open" &&
    (isInternalUrl(registerUrl) || isHttpsUrl(registerUrl));
  const canNotify = isInternalUrl(notifyUrl) || isHttpsUrl(notifyUrl);

  return (
    <div
      className={styles.statusPanel}
      role="group"
      aria-label={getAccessibleStatus(status)}
    >
      <span className={styles.redStrip} aria-hidden="true" />
      <span className={styles.cardHole} aria-hidden="true" />
      <div className={styles.statusContent}>
        {status.state === "open" ? (
          <>
            <p className={styles.openLabel}>
              <span aria-hidden="true" />
              Pendaftaran dibuka
            </p>
            {status.daysLeft === 0 ? (
              <p className={styles.closedToday}>Ditutup hari ini</p>
            ) : status.daysLeft !== undefined && status.closesAt ? (
              <>
                <div className={styles.countdown} aria-hidden="true">
                  <span className={styles.days}>{status.daysLeft}</span>
                  <span className={styles.daysLabel}>hari lagi</span>
                </div>
                <p className={styles.dateLabel}>
                  Ditutup{" "}
                  <time dateTime={status.closesAt}>
                    {formatTanggal(status.closesAt)}
                  </time>
                </p>
              </>
            ) : null}
          </>
        ) : (
          <>
            <h3 className={styles.statusTitle}>{getStatusLabel(status)}</h3>
            {status.state === "upcoming" && status.opensAt && (
              <p className={styles.dateLabel}>
                Dibuka{" "}
                <time dateTime={status.opensAt}>
                  {formatTanggal(status.opensAt)}
                </time>
              </p>
            )}
            {status.state === "closed" && status.closesAt && (
              <p className={styles.dateLabel}>
                Ditutup{" "}
                <time dateTime={status.closesAt}>
                  {formatTanggal(status.closesAt)}
                </time>
              </p>
            )}
          </>
        )}

        {status.state === "open" && canRegister ? (
          <RecruitmentButton
            href={isInternalUrl(registerUrl) ? "/pendaftaran" : registerUrl}
            label="Daftar sekarang"
            external={isHttpsUrl(registerUrl)}
          />
        ) : status.state === "open" ? (
          <p className={styles.unavailable}>
            Informasi pendaftaran akan segera diumumkan.
          </p>
        ) : canNotify ? (
          <RecruitmentButton
            href={notifyUrl}
            label="Kabari saya"
            external={isHttpsUrl(notifyUrl)}
          />
        ) : null}
      </div>
    </div>
  );
}

function InformationList({
  title,
  items,
  ordered = false,
}: {
  title: string;
  items: string[] | { title: string; description?: string }[];
  ordered?: boolean;
}) {
  if (items.length === 0) return null;
  const List = ordered ? "ol" : "ul";

  return (
    <section className={styles.information}>
      <h3 className={styles.informationTitle}>{title}</h3>
      <List className={ordered ? styles.processList : styles.bulletList}>
        {items.map((item, index) => {
          if (typeof item === "string") {
            return <li key={`${title}-${index}`}>{item}</li>;
          }

          return (
            <li className={styles.processItem} key={`${title}-${index}`}>
              <span className={styles.processNumber} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className={styles.processName}>{item.title}</p>
                {item.description && (
                  <p className={styles.processDescription}>
                    {item.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </List>
    </section>
  );
}

export function LandingJoin({
  status,
  settings,
}: {
  status: RecruitmentStatus;
  settings: RecruitmentSettings;
}) {
  const hasInformation =
    RECRUITMENT.requirements.length > 0 ||
    RECRUITMENT.process.length > 0 ||
    RECRUITMENT.benefits.length > 0;

  return (
    <section
      className={styles.section}
      id="gabung"
      aria-labelledby="gabung-judul"
    >
      <div className={`${styles.content} site-container`}>
        <div className={styles.mainGrid}>
          <header className={styles.heading}>
            <h2 className={styles.title} id="gabung-judul">
              {RECRUITMENT.heading}
            </h2>
            <p className={styles.lead}>{RECRUITMENT.lead}</p>
          </header>
          <StatusPanel status={status} settings={settings} />
        </div>

        {hasInformation && (
          <div className={styles.informationGrid}>
            <InformationList
              title="Siapa yang boleh daftar"
              items={RECRUITMENT.requirements}
            />
            <InformationList
              title="Prosesnya"
              items={RECRUITMENT.process}
              ordered
            />
            <InformationList
              title="Yang kamu dapat"
              items={RECRUITMENT.benefits}
            />
          </div>
        )}
      </div>
    </section>
  );
}
