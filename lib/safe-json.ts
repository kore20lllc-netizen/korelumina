/**
 * Safely parse JSON without throwing.
 */
export function safeParse<T = unknown>(
  input: string
):
  | { ok: true; data: T }
  | { ok: false; error: Error } {
  try {
    return {
      ok: true,
      data: JSON.parse(input) as T,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error
          : new Error("Invalid JSON"),
    };
  }
}
