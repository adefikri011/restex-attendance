export type AccountCredentialExport = {
  id: string;
  name: string;
  email: string;
  initialPassword: string;
};

function escapeCsvCell(value: string) {
  const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function downloadAccountCredentials(
  credentials: AccountCredentialExport[],
  filename: string,
) {
  const rows = [
    ["Nama", "Email", "Password awal"],
    ...credentials.map(({ name, email, initialPassword }) => [
      name,
      email,
      initialPassword,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
