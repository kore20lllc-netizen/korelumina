import fs from "fs";
import path from "path";

export type Framework = "vite" | "next" | "custom";

export type ManifestCommand = {
  cmd: string;
  args: string[];
};

export type ProjectManifest = {
  name: string;
  framework: Framework;
  rootDir: string;
  outputDir: string;
  entry: string | null;
  commands: {
    build: ManifestCommand;
    preview: ManifestCommand;
  };
};

type EnsureOpts = {
  strict: boolean;
};

function exists(p: string) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function readJson<T = any>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

function detectFramework(projectRoot: string): Framework {
  const pkgPath = path.join(projectRoot, "package.json");
  const pkg = readJson<any>(pkgPath);
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };

  if (deps?.next) return "next";
  if (deps?.vite) return "vite";

  // fallback: common files
  if (exists(path.join(projectRoot, "vite.config.ts")) || exists(path.join(projectRoot, "vite.config.js")))
    return "vite";
  if (exists(path.join(projectRoot, "next.config.js")) || exists(path.join(projectRoot, "next.config.mjs")) || exists(path.join(projectRoot, "next.config.ts")))
    return "next";

  return "custom";
}

function defaultManifest(projectRoot: string, projectId: string): ProjectManifest {
  const framework = detectFramework(projectRoot);

  const rootDir = exists(path.join(projectRoot, "src")) ? "src" : ".";
  const entry =
    framework === "vite"
      ? (exists(path.join(projectRoot, "src", "main.tsx")) ? "main.tsx"
        : exists(path.join(projectRoot, "src", "main.ts")) ? "main.ts"
        : exists(path.join(projectRoot, "src", "index.tsx")) ? "index.tsx"
        : exists(path.join(projectRoot, "src", "index.ts")) ? "index.ts"
        : null)
      : null;

  const outputDir = framework === "vite" ? "dist" : framework === "next" ? ".next" : "dist";

  // Commands are explicit and portable; preview supports $PORT substitution.
  const commands: ProjectManifest["commands"] = {
    build: { cmd: "npm", args: ["run", "build"] },
    preview:
      framework === "vite"
        ? { cmd: "npm", args: ["run", "dev", "--", "--host", "0.0.0.0", "--port", "$PORT"] }
        : { cmd: "npm", args: ["run", "dev", "--", "--host", "0.0.0.0", "--port", "$PORT"] },
  };

  return {
    name: projectId,
    framework,
    rootDir,
    outputDir,
    entry,
    commands,
  };
}

function validateManifest(m: any, strict: boolean): ProjectManifest {
  const fail = (msg: string) => {
    if (strict) throw new Error(msg);
    return null;
  };

  if (!m || typeof m !== "object") {
    const res = fail("Invalid manifest: not an object");
    // @ts-ignore
    return res;
  }

  const name = typeof m.name === "string" ? m.name : null;
  const framework: Framework =
    m.framework === "vite" || m.framework === "next" || m.framework === "custom"
      ? m.framework
      : "custom";

  const rootDir = typeof m.rootDir === "string" ? m.rootDir : ".";
  const outputDir = typeof m.outputDir === "string" ? m.outputDir : "dist";
  const entry = typeof m.entry === "string" ? m.entry : null;

  const build = m?.commands?.build;
  const preview = m?.commands?.preview;

  if (strict) {
    if (!name) throw new Error("Invalid manifest: missing name");
    if (!build || typeof build.cmd !== "string" || !Array.isArray(build.args))
      throw new Error("Invalid manifest: missing commands.build");
    if (!preview || typeof preview.cmd !== "string" || !Array.isArray(preview.args))
      throw new Error("Invalid manifest: missing commands.preview");
  }

  const safeBuild: ManifestCommand = {
    cmd: typeof build?.cmd === "string" ? build.cmd : "npm",
    args: Array.isArray(build?.args) ? build.args.map(String) : ["run", "build"],
  };

  const safePreview: ManifestCommand = {
    cmd: typeof preview?.cmd === "string" ? preview.cmd : "npm",
    args: Array.isArray(preview?.args) ? preview.args.map(String) : ["run", "dev", "--", "--host", "0.0.0.0", "--port", "$PORT"],
  };

  return {
    name: name || "project",
    framework,
    rootDir,
    outputDir,
    entry,
    commands: {
      build: safeBuild,
      preview: safePreview,
    },
  };
}

export function manifestPath(projectRoot: string) {
  return path.join(projectRoot, "korelumina.manifest.json");
}

export function ensureManifest(projectRoot: string, projectId: string, opts: EnsureOpts): ProjectManifest {
  const p = manifestPath(projectRoot);

  if (exists(p)) {
    const raw = readJson<any>(p);
    if (raw) return validateManifest(raw, opts.strict);
    if (opts.strict) throw new Error("Manifest exists but is invalid JSON");
  }

  const m = defaultManifest(projectRoot, projectId);

  // Always write a manifest file (this becomes the single source of truth).
  fs.writeFileSync(p, JSON.stringify(m, null, 2), "utf8");
  return m;
}

export function resolveManifestCommand(
  manifest: ProjectManifest,
  kind: "build" | "preview",
  port?: number
): ManifestCommand {
  const cmd = manifest.commands[kind].cmd;
  const args = manifest.commands[kind].args.map(a => {
    if (a === "$PORT") return port != null ? String(port) : "";
    return a;
  }).filter(Boolean);

  return { cmd, args };
}
