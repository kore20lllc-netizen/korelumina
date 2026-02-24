export function parseStrictJson(raw: string) {
  const trimmed = raw.trim();

  if (trimmed.includes("```")) {
    throw new Error("AI output contained markdown fences. JSON only required.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {}

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");

  if (first >= 0 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    return JSON.parse(slice);
  }

  throw new Error("AI output was not valid JSON.");
}
