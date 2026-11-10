import type { AttendanceSession } from "@/components/attendance/attendance-data";
import type { MemberAttendanceSummary } from "./report-data";

type ExportReport = {
  periodName: string;
  rangeLabel: string;
  sessions: AttendanceSession[];
  memberSummaries: MemberAttendanceSummary[];
};

export async function exportAttendanceReport({
  periodName,
  rangeLabel,
  sessions,
  memberSummaries,
}: ExportReport) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "RESTEX Attendance";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "Informasi", key: "label", width: 28 },
    { header: "Nilai", key: "value", width: 32 },
  ];
  summarySheet.addRows([
    { label: "Periode", value: periodName },
    { label: "Rentang laporan", value: rangeLabel },
    { label: "Total sesi dalam rentang", value: sessions.length },
    { label: "Sesi selesai", value: sessions.filter((session) => session.status === "Ditutup").length },
    {
      label: "Hadir",
      value: memberSummaries.reduce((total, member) => total + member.hadir, 0),
    },
    {
      label: "Izin",
      value: memberSummaries.reduce((total, member) => total + member.izin, 0),
    },
    {
      label: "Sakit",
      value: memberSummaries.reduce((total, member) => total + member.sakit, 0),
    },
    {
      label: "Alpha",
      value: memberSummaries.reduce((total, member) => total + member.alpha, 0),
    },
  ]);
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  summarySheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0B2F4A" },
  };

  const sessionSheet = workbook.addWorksheet("Per sesi");
  sessionSheet.columns = [
    { header: "ID sesi", key: "id", width: 20 },
    { header: "Nama kegiatan", key: "title", width: 32 },
    { header: "Jenis", key: "type", width: 18 },
    { header: "Tanggal", key: "date", width: 16 },
    { header: "Status sesi", key: "status", width: 16 },
    { header: "Hadir", key: "hadir", width: 12 },
    { header: "Izin", key: "izin", width: 12 },
    { header: "Sakit", key: "sakit", width: 12 },
    { header: "Alpha", key: "alpha", width: 12 },
  ];
  for (const session of sessions) {
    const counts = {
      Hadir: 0,
      Izin: 0,
      Sakit: 0,
      Alpha: 0,
    };
    for (const entry of session.attendance) counts[entry.status] += 1;
    sessionSheet.addRow({
      id: session.id,
      title: session.title,
      type: session.type,
      date: session.date,
      status: session.status,
      hadir: counts.Hadir,
      izin: counts.Izin,
      sakit: counts.Sakit,
      alpha: counts.Alpha,
    });
  }
  sessionSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sessionSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0B2F4A" },
  };

  const memberSheet = workbook.addWorksheet("Per anggota");
  memberSheet.columns = [
    { header: "ID anggota", key: "id", width: 20 },
    { header: "Nama anggota", key: "name", width: 30 },
    { header: "Divisi", key: "division", width: 26 },
    { header: "Hadir", key: "hadir", width: 12 },
    { header: "Izin", key: "izin", width: 12 },
    { header: "Sakit", key: "sakit", width: 12 },
    { header: "Alpha", key: "alpha", width: 12 },
    { header: "Kehadiran", key: "attendanceRate", width: 15 },
  ];
  for (const summary of memberSummaries) {
    memberSheet.addRow({
      id: summary.member.id,
      name: summary.member.name,
      division: summary.member.division,
      hadir: summary.hadir,
      izin: summary.izin,
      sakit: summary.sakit,
      alpha: summary.alpha,
      attendanceRate: `${summary.attendanceRate}%`,
    });
  }
  memberSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  memberSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0B2F4A" },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const file = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const objectUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `laporan-absensi-${periodName.replaceAll(" ", "").replace("—", "-")}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
