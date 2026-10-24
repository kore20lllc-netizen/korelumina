import crypto from "node:crypto";

/*
 * MS-2026-0016 (ADR-0047 Decision 1): connection tokens are encrypted at
 * rest with AES-256-GCM. The key comes only from Runtime's environment
 * (KORELUMINA_CONNECTIONS_KEY, 32 bytes, base64). Each secret is bound to
 * its owner and provider as authenticated data, so a stored secret copied
 * to another person's file cannot be decrypted there.
 */

const VERSION = "v1";

export class ConnectionKeyMissing extends Error {
  constructor() {
    super("connections_key_missing");
  }
}

export function connectionKeyFromEnvironment(env: NodeJS.ProcessEnv = process.env): Buffer | null {
  const raw = env.KORELUMINA_CONNECTIONS_KEY?.trim();
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

export function sealSecret(plain: string, key: Buffer, context: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const sealed = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64"), cipher.getAuthTag().toString("base64"), sealed.toString("base64")].join(".");
}

export function openSecret(sealed: string, key: Buffer, context: string): string {
  const [version, iv, tag, body] = sealed.split(".");
  if (version !== VERSION || !iv || !tag || !body) throw new Error("connection_secret_unreadable");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  try {
    return Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("connection_secret_unreadable");
  }
}

/* PKCE (RFC 7636): a verifier kept by Runtime and its S256 challenge sent to the provider. */
export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(48).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function randomState(): string {
  return crypto.randomBytes(24).toString("base64url");
}
