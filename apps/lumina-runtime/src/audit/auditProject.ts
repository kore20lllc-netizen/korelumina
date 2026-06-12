import fs from "node:fs";
import path from "node:path";

import { detectFramework } from "../detect/detectFramework.js";
import type {
  AuditFinding,
  AuditReport,
  AuditSeverity,
  ProjectFingerprint,
} from "./auditTypes.js";

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
]);

const SKIP_DIRS = new Set([
  ".git",
  ".next",
  "dist",
  "build",
  "node_modules",
  "coverage",
  ".turbo",
  ".vercel",
]);

const IMPORT_PATTERN =
  /(?:import\s+(?:[^'"]+\s+from\s+)?|export\s+[^'"]+\s+from\s+|require\s*\()\s*["']([^"']+)["']/g;

function finding(
  id: string,
  severity: AuditSeverity,
  category: AuditFinding["category"],
  title: string,
  description: string,
  recommendation: string,
  file?: string,
): AuditFinding {
  return {
    id,
    severity,
    category,
    title,
    description,
    recommendation,
    ...(file ? { file } : {}),
  };
}

function readPackageJson(projectPath: string): Record<string, any> | null {
  const packagePath = path.join(projectPath, "package.json");

  if (!fs.existsSync(packagePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(packagePath, "utf8"));
  } catch {
    return null;
  }
}

function detectPackageManager(projectPath: string): ProjectFingerprint["packageManager"] {
  if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(projectPath, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(projectPath, "bun.lockb")) || fs.existsSync(path.join(projectPath, "bun.lock"))) return "bun";
  if (fs.existsSync(path.join(projectPath, "package-lock.json"))) return "npm";
  return "unknown";
}

function hasAny(projectPath: string, candidates: string[]): boolean {
  return candidates.some((candidate) => fs.existsSync(path.join(projectPath, candidate)));
}

function walkFiles(root: string): string[] {
  const out: string[] = [];

  function visit(dir: string) {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".env") {
        if (SKIP_DIRS.has(entry.name)) continue;
      }

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        visit(fullPath);
        continue;
      }

      if (entry.isFile()) {
        out.push(fullPath);
      }
    }
  }

  visit(root);
  return out;
}

function resolveImportTarget(projectPath: string, filePath: string, specifier: string): boolean {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
    return true;
  }

  const base = specifier.startsWith("@/")
    ? path.join(projectPath, "src", specifier.slice(2))
    : path.resolve(path.dirname(filePath), specifier);

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.json`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.js"),
    path.join(base, "index.jsx"),
  ];

  return candidates.some((candidate) => fs.existsSync(candidate));
}

function auditImports(projectPath: string, findings: AuditFinding[]) {
  const files = walkFiles(projectPath)
    .filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)))
    .slice(0, 600);

  for (const file of files) {
    const rel = path.relative(projectPath, file);
    const content = fs.readFileSync(file, "utf8");

    let match: RegExpExecArray | null;
    const pattern = new RegExp(IMPORT_PATTERN.source, "g");

    while ((match = pattern.exec(content)) !== null) {
      const specifier = match[1];

      if (!resolveImportTarget(projectPath, file, specifier)) {
        findings.push(
          finding(
            `broken-import:${rel}:${specifier}`,
            "critical",
            "import",
            "Broken import target",
            `Import "${specifier}" does not resolve from ${rel}.`,
            "Review the import path or create the missing module before runtime certification.",
            rel,
          ),
        );
      }
    }
  }
}

function auditLayout(projectPath: string, findings: AuditFinding[]) {
  const files = walkFiles(projectPath)
    .filter((file) => [".tsx", ".jsx", ".ts", ".js", ".css"].includes(path.extname(file)))
    .slice(0, 800);

  for (const file of files) {
    const rel = path.relative(projectPath, file);
    const content = fs.readFileSync(file, "utf8");

    const fixedWidths = [...content.matchAll(/w-\[([0-9]{3,})px\]/g)];

    for (const match of fixedWidths) {
      const px = Number(match[1]);

      if (px >= 768) {
        findings.push(
          finding(
            `layout-fixed-width:${rel}:${px}`,
            "warning",
            "layout",
            "Large fixed-width layout class",
            `Detected Tailwind class w-[${px}px], which may create horizontal overflow in preview or mobile frames.`,
            "Constrain the element with max-w-full, responsive widths, or parent overflow containment.",
            rel,
          ),
        );
      }
    }

    if (content.includes("100vw")) {
      findings.push(
        finding(
          `layout-100vw:${rel}`,
          "warning",
          "layout",
          "100vw usage may cause white strip",
          "Detected 100vw usage. In nested preview containers this can exceed the iframe viewport and create horizontal overflow.",
          "Prefer width: 100% or clamp/max-width inside previewed app layouts.",
          rel,
        ),
      );
    }

    if (/\bfixed\b/.test(content) && /(?:left|right)-\[[^\]]+\]/.test(content)) {
      findings.push(
        finding(
          `layout-fixed-position:${rel}`,
          "info",
          "layout",
          "Fixed positioned element detected",
          "Fixed positioned elements can escape preview containers and cause visible white strips.",
          "Verify this element inside desktop, tablet, and mobile preview frames.",
          rel,
        ),
      );
    }
  }
}

function calculateScore(findings: AuditFinding[]) {
  const score = findings.reduce((current, item) => {
    if (item.severity === "critical") return current - 20;
    if (item.severity === "warning") return current - 5;
    return current - 1;
  }, 100);

  return Math.max(0, score);
}

function statusFromScore(score: number, findings: AuditFinding[]): AuditReport["status"] {
  if (findings.some((item) => item.severity === "critical")) return "needs_repair";
  if (score >= 95) return "certified";
  if (score >= 85) return "verified";
  if (score >= 60) return "audited";
  return "needs_repair";
}

export function auditProject(projectId: string, projectPath: string): AuditReport {
  const findings: AuditFinding[] = [];
  const pkg = readPackageJson(projectPath);
  const deps = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
  };

  if (!pkg) {
    findings.push(
      finding(
        "missing-package-json",
        "critical",
        "build",
        "Missing package.json",
        "The imported project does not contain a readable package.json at the project root.",
        "Confirm the repo root or select the correct app directory before starting runtime.",
      ),
    );
  }

  const packageManager = detectPackageManager(projectPath);
  const hasNpm = fs.existsSync(
  path.join(projectPath, "package-lock.json"),
);

const hasPnpm = fs.existsSync(
  path.join(projectPath, "pnpm-lock.yaml"),
);

const hasYarn = fs.existsSync(
  path.join(projectPath, "yarn.lock"),
);

const hasBun =
  fs.existsSync(path.join(projectPath, "bun.lock")) ||
  fs.existsSync(path.join(projectPath, "bun.lockb"));

const packageManagers = [
  hasNpm && "npm",
  hasPnpm && "pnpm",
  hasYarn && "yarn",
  hasBun && "bun",
].filter(Boolean) as string[];

if (packageManagers.length > 1) {
  findings.push(
    finding(
      "multiple-lockfiles",
      "warning",
      "dependency",
      "Multiple package managers detected",
      `Detected lockfiles from multiple package managers: ${packageManagers.join(", ")}.`,
      "Choose a single package manager for deterministic installs.",
    ),
  );
}

  if (!fs.existsSync(path.join(projectPath, "node_modules"))) {
    findings.push(
      finding(
        "missing-node-modules",
        "warning",
        "dependency",
        "Dependencies not installed",
        "node_modules was not found in the imported project.",
        "Install dependencies before runtime certification.",
      ),
    );
  }

  if (!pkg?.scripts?.dev) {
    findings.push(
      finding(
        "missing-dev-script",
        "critical",
        "runtime",
        "Missing dev script",
        "package.json does not define scripts.dev.",
        "Add a dev script or configure KoreLumina to use the correct workspace command.",
      ),
    );
  }

  if (!pkg?.scripts?.build) {
    findings.push(
      finding(
        "missing-build-script",
        "warning",
        "build",
        "Missing build script",
        "package.json does not define scripts.build.",
        "Add a production build script for certification.",
      ),
    );
  }

  const hasTypescript = hasAny(projectPath, ["tsconfig.json"]) || Boolean(deps.typescript);
  const hasTailwind = hasAny(projectPath, ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.cjs"]) || Boolean(deps.tailwindcss);
  const isWorkspace = Boolean(pkg?.workspaces) || fs.existsSync(path.join(projectPath, "pnpm-workspace.yaml"));

  auditImports(projectPath, findings);
  auditLayout(projectPath, findings);

  if (!hasAny(projectPath, ["public/favicon.ico", "app/favicon.ico", "src/favicon.ico"])) {
    findings.push(
      finding(
        "missing-favicon",
        "info",
        "asset",
        "No favicon detected",
        "No common favicon file was found.",
        "Add a favicon before production certification.",
      ),
    );
  }

  const fingerprint: ProjectFingerprint = {
    framework: detectFramework(projectPath),
    packageManager,
    hasTypescript,
    hasTailwind,
    isWorkspace,
    hasNodeModules: fs.existsSync(path.join(projectPath, "node_modules")),
    hasDevScript: Boolean(pkg?.scripts?.dev),
    hasBuildScript: Boolean(pkg?.scripts?.build),
  };

  const complianceScore = calculateScore(findings);

  return {
    projectId,
    projectPath,
    fingerprint,
    complianceScore,
    status: statusFromScore(complianceScore, findings),
    findings,
    generatedAt: Date.now(),
  };
}
