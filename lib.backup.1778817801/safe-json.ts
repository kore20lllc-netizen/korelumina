export function safeParse<T = any>(input: string | null | undefined, fallback: T): T {
  try {
    if (!input) return fallback;
    return JSON.parse(input);
  } catch (err) {
    console.error("JSON parse failed:", err, input);
    return fallback;
  }
}
