"use client";

import { useEffect, useState } from "react";
import styles from "./structure-subnav.module.css";

export type StructureSectionLink = {
  id: string;
  label: string;
};

export function StructureSubnav({
  sections,
}: {
  sections: StructureSectionLink[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (sections.length < 2) return;

    const targets = sections
      .map(({ id }) => document.getElementById(id))
      .filter((target): target is HTMLElement => target !== null);
    if (targets.length < 2) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              first.boundingClientRect.top - second.boundingClientRect.top,
          );
        const firstVisible = visible[0]?.target;
        if (firstVisible) setActiveId(firstVisible.id);
      },
      {
        rootMargin: "-100px 0px -65% 0px",
        threshold: 0,
      },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className={styles.subnav} aria-label="Bagian struktur">
      <div className={styles.links}>
        {sections.map((section) => (
          <a
            className={styles.link}
            href={`#${section.id}`}
            aria-current={activeId === section.id ? "location" : undefined}
            key={section.id}
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
