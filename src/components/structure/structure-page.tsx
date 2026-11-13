import Link from "next/link";
import type {
  Officer,
  OfficerGroup,
  PeriodStructure,
  StructurePeriod,
} from "@/data/structure";
import { OfficerPortrait } from "./officer-card";
import { OfficerRack } from "./officer-rack";
import {
  StructureSubnav,
  type StructureSectionLink,
} from "./structure-subnav";
import styles from "./structure-page.module.css";

const GROUPS: {
  id: string;
  group: OfficerGroup;
  label: string;
}[] = [
  { id: "bph", group: "bph", label: "Badan Pengurus Harian" },
  { id: "pj-divisi", group: "pj-divisi", label: "PJ Divisi" },
  { id: "humas-infokom", group: "humas-infokom", label: "Humas & Infokom" },
];

function OfficerRows({
  officers,
  group,
}: {
  officers: Officer[];
  group: OfficerGroup;
}) {
  return (
    <ul className={styles.officerRows} role="list">
      {officers.map((officer) => (
        <li className={styles.officerRow} key={officer.id}>
          <OfficerPortrait officer={officer} compact />
          <div className={styles.rowCopy}>
            <h3 className={styles.rowName}>{officer.name}</h3>
            <p className={styles.rowPosition}>
              {group === "pj-divisi" && officer.division
                ? `PJ ${officer.division}`
                : officer.position}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StructurePage({
  structure,
  periods,
}: {
  structure: PeriodStructure | undefined;
  periods: StructurePeriod[];
}) {
  const officers = structure?.officers ?? [];
  const availableGroups = GROUPS.map(({ id, group, label }) => ({
    id,
    group,
    label,
    officers: officers.filter((officer) => officer.group === group),
  })).filter((section) => section.officers.length > 0);
  const sectionLinks: StructureSectionLink[] = availableGroups.map(
    ({ id, label }) => ({ id, label }),
  );

  return (
    <main className={styles.page}>
      <div className={`${styles.content} site-container`}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Pengurus RESTEX</h1>
            {structure && (
              <p className={styles.periodLabel}>
                Periode {structure.label}
              </p>
            )}
          </div>

          {periods.length > 1 && structure && (
            <nav className={styles.periodPicker} aria-label="Pilih periode">
              {periods.map((period) => (
                <Link
                  aria-current={
                    period.slug === structure.slug ? "page" : undefined
                  }
                  className={styles.periodLink}
                  href={
                    period.slug === periods[0]?.slug
                      ? "/struktur"
                      : `/struktur/${period.slug}`
                  }
                  key={period.slug}
                >
                  {period.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        {sectionLinks.length > 1 && (
          <StructureSubnav sections={sectionLinks} />
        )}

        {availableGroups.length === 0 ? (
          <p className={styles.emptyState}>
            Susunan pengurus periode ini belum dipublikasikan.
          </p>
        ) : (
          <div
            className={`${styles.groups} ${
              sectionLinks.length > 1 ? styles.withSubnav : ""
            }`}
          >
            {availableGroups.map((section) => (
              <section
                className={styles.group}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                key={section.id}
              >
                <h2 className={styles.groupTitle} id={`${section.id}-title`}>
                  {section.label}
                </h2>
                {section.group === "bph" ? (
                  <OfficerRack officers={section.officers} />
                ) : (
                  <OfficerRows
                    officers={section.officers}
                    group={section.group}
                  />
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
