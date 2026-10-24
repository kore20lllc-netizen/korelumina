/* MS-2026-0016: provider calls. A provider's own error text is kept out of logs and responses. */

export async function providerJson(
  url: string,
  init: RequestInit,
  failure: string,
): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error(`${failure}:unreachable`);
  }
  let data: Record<string, unknown> = {};
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    data = {};
  }
  if (!response.ok || typeof data.error === "string") {
    throw new Error(`${failure}:${response.status === 401 || response.status === 403 ? "unauthorized" : response.ok ? "refused" : response.status}`);
  }
  return data;
}

export function form(values: Record<string, string>): string {
  return new URLSearchParams(values).toString();
}

export function basicAuth(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export function expiresAt(seconds: unknown, now = Date.now()): number | null {
  return typeof seconds === "number" && seconds > 0 ? now + seconds * 1000 : null;
}

export function text(value: unknown): string | null {
  return typeof value === "string" && value ? value : typeof value === "number" ? String(value) : null;
}
