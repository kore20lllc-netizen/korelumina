import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * MS-2026-0003: verify a Stripe webhook signature without the Stripe SDK.
 *
 * Stripe signs `${timestamp}.${raw body}` with HMAC-SHA256 using the
 * endpoint's signing secret and sends `Stripe-Signature: t=…,v1=…`. An event
 * is accepted only if one v1 signature matches and the timestamp is within
 * the tolerance, so a captured request cannot be replayed later.
 */

export const DEFAULT_TOLERANCE_SECONDS = 300;

export interface StripeEvent {
  id: string;
  type: string;
  created: number;
  livemode: boolean;
  data: { object: Record<string, any> };
}

export type SignatureResult =
  | { ok: true; event: StripeEvent }
  | { ok: false; reason: "missing_signature" | "malformed_signature" | "timestamp_outside_tolerance" | "signature_mismatch" | "malformed_event" };

export function signStripePayload(payload: string, secret: string, timestamp: number): string {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

export function verifyStripeSignature(
  rawBody: Buffer,
  header: string | undefined,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  toleranceSeconds: number = DEFAULT_TOLERANCE_SECONDS,
): SignatureResult {
  if (!header) return { ok: false, reason: "missing_signature" };
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === "t" && /^\d+$/.test(value)) timestamp = Number(value);
    if (key === "v1" && /^[0-9a-f]{64}$/i.test(value)) signatures.push(value.toLowerCase());
  }
  if (timestamp === null || signatures.length === 0) return { ok: false, reason: "malformed_signature" };
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return { ok: false, reason: "timestamp_outside_tolerance" };

  const expected = createHmac("sha256", secret).update(`${timestamp}.`, "utf8").update(rawBody).digest();
  const matched = signatures.some((candidate) => {
    const given = Buffer.from(candidate, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
  if (!matched) return { ok: false, reason: "signature_mismatch" };

  let event: unknown;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed_event" };
  }
  const candidate = event as Partial<StripeEvent>;
  if (
    typeof candidate?.id !== "string" ||
    typeof candidate.type !== "string" ||
    typeof candidate.created !== "number" ||
    !candidate.data ||
    typeof candidate.data.object !== "object" ||
    candidate.data.object === null
  ) {
    return { ok: false, reason: "malformed_event" };
  }
  return { ok: true, event: candidate as StripeEvent };
}
