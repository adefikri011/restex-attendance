import { useState, type FormEvent } from "react";
import { CalendarPlus, X } from "lucide-react";
import type { PeriodRecord } from "./periods-data";
import styles from "./periods.module.css";

type PeriodFormProps = {
  periods: PeriodRecord[];
  onCancel: () => void;
  onCreate: (period: PeriodRecord) => void;
};

export function PeriodForm({ periods, onCancel, onCreate }: PeriodFormProps) {
  const [startDate, setStartDate] = useState("2027-07-01");
  const [endDate, setEndDate] = useState("2028-06-30");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (endDate <= startDate) {
      setError("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }

    if (startDate <= new Date().toISOString().slice(0, 10)) {
      setError("Periode baru harus dimulai setelah hari ini.");
      return;
    }

    const overlaps = periods.some(
      (period) => startDate <= period.endDate && endDate >= period.startDate,
    );
    if (overlaps) {
      setError("Rentang tanggal bertabrakan dengan periode yang sudah ada.");
      return;
    }

    const name = `${new Date(`${startDate}T00:00:00`).getFullYear()} — ${new Date(
      `${endDate}T00:00:00`,
    ).getFullYear()}`;
    if (periods.some((period) => period.name === name)) {
      setError("Periode dengan tahun tersebut sudah tersedia.");
      return;
    }

    onCreate({
      id: `${startDate}-${endDate}`,
      name,
      startDate,
      endDate,
      status: "Akan datang",
      memberCount: 0,
      sessionCount: 0,
      attendanceRate: 0,
    });
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

      <form className={styles.periodForm} onSubmit={handleSubmit}>
        <label>
          Tanggal mulai
          <input
            required
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          Tanggal selesai
          <input
            required
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <div className={styles.formActions}>
          <button type="button" className={styles.secondaryButton} onClick={onCancel}>
            Batal
          </button>
          <button type="submit" className={styles.primaryButton}>
            Simpan periode
          </button>
        </div>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
      </form>
      <p className={styles.formNote}>
        Aktivasi periode dan transisi status anggota dikelola terpisah agar riwayat
        keanggotaan tetap terjaga.
      </p>
    </section>
  );
}
