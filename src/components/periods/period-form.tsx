import { useState, type FormEvent } from "react";
import { CalendarPlus, X } from "lucide-react";
import { getDefaultPeriodEndDate, type PeriodRecord } from "./periods-data";
import styles from "./periods.module.css";
import { notifications } from "@/lib/notifications";

type PeriodFormProps = {
  periods: PeriodRecord[];
  onCancel: () => void;
  onCreate: (period: Pick<PeriodRecord, "startDate" | "endDate">) => Promise<void>;
};

function getDefaultDates(periods: PeriodRecord[]) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const latestEndDate = periods.reduce(
    (latest, period) => (period.endDate > latest ? period.endDate : latest),
    today,
  );
  const startDate = new Date(`${latestEndDate}T00:00:00.000Z`);
  startDate.setUTCDate(startDate.getUTCDate() + 1);
  const startDateString = startDate.toISOString().slice(0, 10);

  return {
    startDate: startDateString,
    endDate: getDefaultPeriodEndDate(startDateString),
  };
}

export function PeriodForm({ periods, onCancel, onCreate }: PeriodFormProps) {
  const [defaults] = useState(() => getDefaultDates(periods));
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [isEndDateManual, setIsEndDateManual] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (endDate <= startDate) {
      notifications.warning(
        "Rentang tanggal belum valid",
        "Tanggal selesai harus setelah tanggal mulai.",
      );
      return;
    }

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    if (startDate <= today) {
      notifications.warning(
        "Tanggal mulai tidak valid",
        "Periode baru harus dimulai setelah hari ini.",
      );
      return;
    }

    const overlaps = periods.some(
      (period) => startDate <= period.endDate && endDate >= period.startDate,
    );
    if (overlaps) {
      notifications.warning(
        "Periode bertabrakan",
        "Rentang tanggal bertabrakan dengan periode yang sudah ada.",
      );
      return;
    }

    setIsSaving(true);
    try {
      await onCreate({ startDate, endDate });
    } catch (error) {
      notifications.error(
        "Periode gagal disimpan",
        error instanceof Error ? error.message : "Silakan coba lagi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.formPanel} aria-labelledby="create-period-title">
      <div className={styles.formHeading}>
        <div className={styles.formIcon} aria-hidden="true">
          <CalendarPlus size={19} />
        </div>
        <div>
          <span className={styles.sectionEyebrow}>PERIODE BARU</span>
          <h2 id="create-period-title">Siapkan periode kepengurusan</h2>
          <p>Periode baru dibuat sebagai rencana dan tidak langsung diaktifkan.</p>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onCancel}
          aria-label="Tutup form periode"
        >
          <X size={18} />
        </button>
      </div>

      <form className={styles.periodForm} onSubmit={handleSubmit} aria-busy={isSaving}>
        <label>
          Tanggal mulai
          <input
            required
            type="date"
            value={startDate}
            onChange={(event) => {
              const nextStartDate = event.target.value;
              setStartDate(nextStartDate);
              if (!isEndDateManual) {
                setEndDate(
                  nextStartDate ? getDefaultPeriodEndDate(nextStartDate) : "",
                );
              }
            }}
          />
        </label>
        <label>
          Tanggal selesai
          <input
            required
            type="date"
            min={startDate}
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setIsEndDateManual(true);
            }}
          />
        </label>
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
            disabled={isSaving}
          >
            Batal
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan periode"}
          </button>
        </div>
      </form>
      <p className={styles.formNote}>
        Tanggal selesai mengikuti tanggal mulai selama belum diatur manual. Periode
        tetap berupa rencana sampai diaktifkan.
      </p>
    </section>
  );
}
