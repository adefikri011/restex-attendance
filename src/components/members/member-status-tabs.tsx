import { membershipStatuses, type MembershipStatus } from "./member-data";
import styles from "./member-controls.module.css";

export type StatusFilter = MembershipStatus | "Semua";

type MemberStatusTabsProps = {
  activeStatus: StatusFilter;
  members: { status: MembershipStatus }[];
  onChange: (status: StatusFilter) => void;
};

export function MemberStatusTabs({
  activeStatus,
  members,
  onChange,
}: MemberStatusTabsProps) {
  const filters: StatusFilter[] = ["Semua", ...membershipStatuses];

  return (
    <div className={styles.statusTabs} role="tablist" aria-label="Filter status anggota">
      {filters.map((status) => {
        const count =
          status === "Semua"
            ? members.length
            : members.filter((member) => member.status === status).length;
        const isSelected = activeStatus === status;

        return (
          <button
            key={status}
            id={`member-tab-${status.toLowerCase()}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls="member-list-panel"
            className={`${styles.statusTab} ${isSelected ? styles.selectedStatusTab : ""}`}
            onClick={() => onChange(status)}
          >
            {status}
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
