const ALLOWED_PREFIXES = ["src/", "generated/", "components/", "lib/"];

export function enforceManifestGate(paths: unknown[]) {
  for (const raw of paths) {
    if (typeof raw !== "string") {
      throw new Error(`Path not allowed by manifest: non-string value`);
    }
    const p = raw;

    if (p.includes("..")) throw new Error(`Path traversal detected: ${p}`);
    if (p.startsWith("/")) throw new Error(`Absolute paths not allowed: ${p}`);

    if (!ALLOWED_PREFIXES.some((prefix) => p.startsWith(prefix))) {
      throw new Error(`Path not allowed by manifest: ${p}`);
    }
  }
}
