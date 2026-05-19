import fs from "fs";
import path from "path";

type GateInput =
  | { workspaceId: string; projectId: string; paths: string[] }
  | string[];

function normalizeSlash(p: string) {
  return p.replace(/\\/g, "/");
}

function sanitizeRelativePath(p: string) {
  if (typeof p !== "string") throw new Error("Invalid path type");

  let s = p.trim().replace(/`+/g, "");
  s = normalizeSlash(s);

  if (s.startsWith("/") || /^[A-Za-z]:\//.test(s)) {
    throw new Error(`Absolute path not allowed: ${p}`);
  }

  if (s.includes("..")) {
    throw new Error(`Path traversal not allowed: ${p}`);
  }

  const norm = path.posix.normalize(s);

  if (norm.startsWith("..") || norm.includes("/..")) {
    throw new Error(`Path traversal not allowed: ${p}`);
  }

  return norm;
}

function resolveManifestPath(workspaceId: string, projectId: string) {
  return path.join(
    process.cwd(),
    "runtime",
    "workspaces",
    workspaceId,
    "projects",
    projectId,
    "manifest.json"
  );
}

function loadManifest(workspaceId: string, projectId: string) {
  const manifestPath = resolveManifestPath(workspaceId, projectId);

  if (!fs.existsSync(manifestPath)) {
    // Safe default: src only
    return { allow: ["src/"] };
  }

  const raw = fs.readFileSync(manifestPath, "utf8");
  return JSON.parse(raw) as { allow: string[] };
}

function coerceInput(input: GateInput) {
  if (Array.isArray(input)) {
    throw new Error("Manifest gate requires workspaceId and projectId");
  }

  if (
    input &&
    typeof input === "object" &&
    Array.isArray((input as any).paths)
  ) {
    return input as { workspaceId: string; projectId: string; paths: string[] };
  }

  throw new Error("Invalid manifest gate input");
}

export function enforceManifestGate(input: GateInput) {
  const { workspaceId, projectId, paths } = coerceInput(input);

  const manifest = loadManifest(workspaceId, projectId);
  const allow = (manifest.allow ?? []).map(normalizeSlash);

  const sanitized = paths.map(sanitizeRelativePath);

  for (const p of sanitized) {
    const ok = allow.some((prefix) =>
      p === prefix ||
      p.startsWith(prefix.endsWith("/") ? prefix : prefix + "/")
    );

    if (!ok) {
      throw new Error(`Path not allowed by manifest: ${p}`);
    }
  }

  return sanitized;
}
