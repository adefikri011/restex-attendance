function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function saveStudyProgram(name: string, captchaToken: string | null) {
  const response = await fetch("/api/study-programs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, captchaToken }),
  });
  const result: unknown = await response.json();

  if (
    !response.ok ||
    !isRecord(result) ||
    !isRecord(result.program) ||
    typeof result.program.name !== "string"
  ) {
    throw new Error(
      isRecord(result) && typeof result.error === "string"
        ? result.error
        : "Program studi gagal disimpan. Silakan coba kembali.",
    );
  }

  return result.program.name;
}
