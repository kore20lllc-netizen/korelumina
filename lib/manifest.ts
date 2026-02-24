import fs from "fs";
import path from "path";

export type ManifestV1 = {
  version: 1;
  rules: {
    allow: string[];
    deny: string[];
    maxFilesTouched?: number;
    maxFileBytes?: number;
  };
};

const MANIFEST_FILE = path.join(process.cwd(), "korelumina.manifest.json");

function globToRegExp(glob: string): RegExp {
  const esc = (s: string) => s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const normalized = glob.replace(/\\/g, "/").trim();
  const parts = normalized.split("/").map((p) => {
    if (p === "**") return ".*";
    const seg = esc(p).replace(/\\\*/g, "[^/]*");
    return seg;
  });
  return new RegExp("^" + parts.join("/") + "$");
}

export function normalizeRelPath(p: string): string {
  const rel = path.isAbsolute(p) ? path.relative(process.cwd(), p) : p;
  return rel.replace(/\\/g, "/").replace(/^\.\/+/, "");
}

export function loadManifest(): ManifestV1 {
  if (!fs.existsSync(MANIFEST_FILE)) {
    throw new Error("Missing korelumina.manifest.json");
  }

  const parsed = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));

  if (parsed.version !== 1) throw new Error("Manifest version must be 1");
  if (!parsed.rules?.allow || !Array.isArray(parsed.rules.allow)) {
    throw new Error("Manifest.rules.allow invalid");
  }
  if (!Array.isArray(parsed.rules.deny)) {
    throw new Error("Manifest.rules.deny invalid");
  }

  return parsed as ManifestV1;
}

export function pathAllowed(relPath: string, manifest: ManifestV1): boolean {
  const p = normalizeRelPath(relPath);

  const denied = manifest.rules.deny.some((g) =>
    globToRegExp(g).test(p)
  );
  if (denied) return false;

  const allowed = manifest.rules.allow.some((g) =>
    globToRegExp(g).test(p)
  );
  return allowed;
}
