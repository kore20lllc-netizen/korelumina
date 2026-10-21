import path from "node:path";

import type { RepositorySnapshot } from "./RepositorySnapshot.js";

/*
 * MS-2026-0012: what a repository is made of, read only from its files.
 * Everything here is derived from the snapshot, so it is deterministic.
 */

export const LANGUAGE_BY_EXTENSION: Readonly<Record<string, string>> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".mts": "TypeScript",
  ".cts": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sass": "SCSS",
  ".less": "Less",
  ".html": "HTML",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".astro": "Astro",
  ".json": "JSON",
  ".md": "Markdown",
  ".mdx": "MDX",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".kt": "Kotlin",
  ".rb": "Ruby",
  ".php": "PHP",
  ".cs": "C#",
  ".swift": "Swift",
  ".sql": "SQL",
  ".sh": "Shell",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".toml": "TOML",
};

export interface LanguageShare {
  language: string;
  files: number;
  bytes: number;
  lines: number;
}

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export interface PackageManagerEvidence {
  manager: PackageManager | null;
  lockfiles: string[];
  /* More than one lockfile is a finding: installs are not reproducible. */
  conflicting: boolean;
  declared: string | null;
}

export interface DetectedFramework {
  id: string;
  name: string;
  version: string | null;
}

export interface WorkspacePackage {
  /* Directory relative to the repository root; "." for the root package. */
  directory: string;
  manifest: string;
  name: string | null;
  version: string | null;
  private: boolean;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  optionalDependencies: Record<string, string>;
  frameworks: DetectedFramework[];
  tooling: string[];
  entryPoints: string[];
  /* package.json that could not be parsed. */
  parseError: string | null;
}

export interface RepositoryInventory {
  totalFiles: number;
  totalBytes: number;
  textFiles: number;
  languages: LanguageShare[];
  packageManager: PackageManagerEvidence;
  workspaceGlobs: string[];
  packages: WorkspacePackage[];
  configFiles: string[];
  /* Ignored ones are local only; a tracked one is committed to the repository. */
  environmentFiles: { path: string; ignored: boolean; tracked: boolean | null }[];
  documentation: string[];
}

const FRAMEWORKS: readonly { id: string; name: string; packages: string[] }[] = [
  { id: "next", name: "Next.js", packages: ["next"] },
  { id: "nuxt", name: "Nuxt", packages: ["nuxt"] },
  { id: "remix", name: "Remix", packages: ["@remix-run/react", "@remix-run/node"] },
  { id: "astro", name: "Astro", packages: ["astro"] },
  { id: "sveltekit", name: "SvelteKit", packages: ["@sveltejs/kit"] },
  { id: "svelte", name: "Svelte", packages: ["svelte"] },
  { id: "angular", name: "Angular", packages: ["@angular/core"] },
  { id: "vue", name: "Vue", packages: ["vue"] },
  { id: "react", name: "React", packages: ["react"] },
  { id: "solid", name: "Solid", packages: ["solid-js"] },
  { id: "vite", name: "Vite", packages: ["vite"] },
  { id: "express", name: "Express", packages: ["express"] },
  { id: "fastify", name: "Fastify", packages: ["fastify"] },
  { id: "nestjs", name: "NestJS", packages: ["@nestjs/core"] },
  { id: "hono", name: "Hono", packages: ["hono"] },
  { id: "electron", name: "Electron", packages: ["electron"] },
  { id: "react-native", name: "React Native", packages: ["react-native"] },
  { id: "expo", name: "Expo", packages: ["expo"] },
];

const TOOLING: readonly { id: string; packages: string[]; files?: RegExp }[] = [
  { id: "typescript", packages: ["typescript"], files: /(^|\/)tsconfig(\.[\w-]+)?\.json$/ },
  { id: "eslint", packages: ["eslint"], files: /(^|\/)(\.eslintrc(\.\w+)?|eslint\.config\.\w+)$/ },
  { id: "prettier", packages: ["prettier"], files: /(^|\/)(\.prettierrc(\.\w+)?|prettier\.config\.\w+)$/ },
  { id: "biome", packages: ["@biomejs/biome"], files: /(^|\/)biome\.jsonc?$/ },
  { id: "vitest", packages: ["vitest"] },
  { id: "jest", packages: ["jest"], files: /(^|\/)jest\.config\.\w+$/ },
  { id: "playwright", packages: ["@playwright/test"], files: /(^|\/)playwright\.config\.\w+$/ },
  { id: "cypress", packages: ["cypress"] },
  { id: "tailwind", packages: ["tailwindcss"], files: /(^|\/)tailwind\.config\.\w+$/ },
  { id: "storybook", packages: ["storybook", "@storybook/react"] },
  { id: "turborepo", packages: ["turbo"], files: /^turbo\.json$/ },
  { id: "nx", packages: ["nx"], files: /^nx\.json$/ },
  { id: "docker", packages: [], files: /(^|\/)(Dockerfile|docker-compose\.ya?ml|compose\.ya?ml)$/ },
  { id: "supabase", packages: ["@supabase/supabase-js"], files: /^supabase\/config\.toml$/ },
  { id: "prisma", packages: ["prisma", "@prisma/client"], files: /(^|\/)schema\.prisma$/ },
];

const CONFIG_FILE =
  /(^|\/)(package\.json|tsconfig(\.[\w-]+)?\.json|vite\.config\.\w+|next\.config\.\w+|nuxt\.config\.\w+|astro\.config\.\w+|svelte\.config\.\w+|webpack\.config\.\w+|rollup\.config\.\w+|babel\.config\.\w+|\.babelrc|postcss\.config\.\w+|tailwind\.config\.\w+|vercel\.json|netlify\.toml|turbo\.json|nx\.json|pnpm-workspace\.yaml|\.nvmrc|\.node-version|Dockerfile)$/;
const ENVIRONMENT_FILE = /(^|\/)\.env(\.[\w.-]+)?$/;
const DOCUMENTATION = /(^|\/)(README|CHANGELOG|CONTRIBUTING|LICENSE|SECURITY)(\.\w+)?$/i;
const LOCKFILES: Record<string, PackageManager> = {
  "package-lock.json": "npm",
  "npm-shrinkwrap.json": "npm",
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
  "bun.lockb": "bun",
  "bun.lock": "bun",
};

function sortedRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, version]) => typeof version === "string")
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  return Object.fromEntries(entries) as Record<string, string>;
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  let lines = 1;
  for (let index = 0; index < text.length; index += 1) if (text.charCodeAt(index) === 10) lines += 1;
  return text.endsWith("\n") ? lines - 1 : lines;
}

function workspaceGlobsFrom(rootPackage: Record<string, unknown> | null, pnpmWorkspace: string | null): string[] {
  const globs: string[] = [];
  const declared = rootPackage?.workspaces;
  if (Array.isArray(declared)) globs.push(...declared.filter((glob): glob is string => typeof glob === "string"));
  else if (declared && typeof declared === "object" && Array.isArray((declared as { packages?: unknown }).packages)) {
    globs.push(...((declared as { packages: unknown[] }).packages.filter((glob): glob is string => typeof glob === "string")));
  }
  if (pnpmWorkspace) {
    let inPackages = false;
    for (const line of pnpmWorkspace.split("\n")) {
      if (/^packages\s*:/.test(line)) {
        inPackages = true;
        continue;
      }
      if (inPackages) {
        const match = line.match(/^\s*-\s*["']?([^"'#]+?)["']?\s*(#.*)?$/);
        if (match) globs.push(match[1]!.trim());
        else if (/^\S/.test(line)) inPackages = false;
      }
    }
  }
  return [...new Set(globs)].sort();
}

/* Workspace globs as used in practice: "apps/*", "packages/**", exact paths, "!" exclusions. */
function matchesWorkspaceGlob(directory: string, globs: readonly string[]): boolean {
  let included = false;
  for (const glob of globs) {
    const negated = glob.startsWith("!");
    const pattern = (negated ? glob.slice(1) : glob).replace(/\/+$/, "").replace(/^\.\//, "");
    const expression = new RegExp(
      `^${pattern
        .split("/")
        .map((part) => (part === "**" ? ".*" : part.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")))
        .join("/")}$`,
    );
    if (expression.test(directory)) included = !negated;
  }
  return included;
}

function entryPointsOf(directory: string, manifest: Record<string, unknown>, files: ReadonlySet<string>, read: (file: string) => string | null): string[] {
  const prefix = directory === "." ? "" : `${directory}/`;
  const candidates = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value !== "string") return;
    const normalized = path.posix.normalize(`${prefix}${value.replace(/^\.\//, "")}`);
    candidates.add(normalized);
  };
  add(manifest.main);
  add(manifest.module);
  add(manifest.types);
  if (typeof manifest.bin === "string") add(manifest.bin);
  else if (manifest.bin && typeof manifest.bin === "object") Object.values(manifest.bin).forEach(add);

  const html = `${prefix}index.html`;
  const page = files.has(html) ? read(html) : null;
  if (page) {
    for (const match of page.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/g)) {
      const source = match[1]!;
      if (/^(https?:)?\/\//.test(source)) continue;
      add(source.replace(/^\//, ""));
    }
  }
  for (const conventional of [
    "src/main.tsx",
    "src/main.ts",
    "src/main.jsx",
    "src/main.js",
    "src/index.tsx",
    "src/index.ts",
    "src/index.js",
    "src/server.ts",
    "src/app.ts",
    "index.ts",
    "index.js",
    "server.js",
  ]) {
    if (files.has(`${prefix}${conventional}`)) candidates.add(`${prefix}${conventional}`);
  }
  for (const routed of ["app/layout.tsx", "app/layout.jsx", "app/layout.js", "src/app/layout.tsx", "pages/_app.tsx", "pages/_app.js", "src/pages/_app.tsx"]) {
    if (files.has(`${prefix}${routed}`)) candidates.add(`${prefix}${routed}`);
  }
  return [...candidates].sort();
}

export function takeRepositoryInventory(fullSnapshot: RepositorySnapshot): RepositoryInventory {
  /* The inventory describes the repository, not ignored local files. */
  const snapshot = { ...fullSnapshot, files: fullSnapshot.files.filter((file) => !file.ignored) };
  const paths = new Set(snapshot.files.map((file) => file.path));
  const languages = new Map<string, LanguageShare>();
  let totalBytes = 0;
  let textFiles = 0;

  for (const file of snapshot.files) {
    totalBytes += file.bytes;
    if (file.text) textFiles += 1;
    const language = LANGUAGE_BY_EXTENSION[path.posix.extname(file.path).toLowerCase()];
    if (!language) continue;
    const share = languages.get(language) ?? { language, files: 0, bytes: 0, lines: 0 };
    share.files += 1;
    share.bytes += file.bytes;
    const text = file.text ? snapshot.read(file.path) : null;
    if (text !== null) share.lines += countLines(text);
    languages.set(language, share);
  }

  const parse = (file: string): { value: Record<string, unknown> | null; error: string | null } => {
    const text = snapshot.read(file);
    if (text === null) return { value: null, error: "unreadable" };
    try {
      const value = JSON.parse(text);
      return value && typeof value === "object" && !Array.isArray(value)
        ? { value: value as Record<string, unknown>, error: null }
        : { value: null, error: "not_an_object" };
    } catch (error) {
      return { value: null, error: (error as Error).message };
    }
  };

  const root = paths.has("package.json") ? parse("package.json").value : null;
  const workspaceGlobs = workspaceGlobsFrom(root, paths.has("pnpm-workspace.yaml") ? snapshot.read("pnpm-workspace.yaml") : null);

  const lockfiles = snapshot.files
    .map((file) => file.path)
    .filter((file) => !file.includes("/") && LOCKFILES[file] !== undefined);
  const managers = [...new Set(lockfiles.map((file) => LOCKFILES[file]!))].sort();
  const declaredManager = typeof root?.packageManager === "string" ? root.packageManager : null;
  const declaredName = declaredManager?.split("@")[0] as PackageManager | undefined;

  const manifests = snapshot.files
    .map((file) => file.path)
    .filter((file) => file === "package.json" || file.endsWith("/package.json"))
    .filter((file) => {
      const directory = path.posix.dirname(file);
      return directory === "." || matchesWorkspaceGlob(directory, workspaceGlobs);
    });

  const packages: WorkspacePackage[] = manifests.map((manifestFile) => {
    const directory = path.posix.dirname(manifestFile);
    const { value, error } = parse(manifestFile);
    const manifest = value ?? {};
    const dependencies = sortedRecord(manifest.dependencies);
    const devDependencies = sortedRecord(manifest.devDependencies);
    const peerDependencies = sortedRecord(manifest.peerDependencies);
    const optionalDependencies = sortedRecord(manifest.optionalDependencies);
    const all = { ...peerDependencies, ...devDependencies, ...dependencies };
    const prefix = directory === "." ? "" : `${directory}/`;
    const ownFiles = snapshot.files.filter((file) => directory === "." || file.path.startsWith(prefix));

    return {
      directory,
      manifest: manifestFile,
      name: typeof manifest.name === "string" ? manifest.name : null,
      version: typeof manifest.version === "string" ? manifest.version : null,
      private: manifest.private === true,
      scripts: sortedRecord(manifest.scripts),
      dependencies,
      devDependencies,
      peerDependencies,
      optionalDependencies,
      frameworks: FRAMEWORKS.flatMap((framework) => {
        const installed = framework.packages.find((name) => all[name] !== undefined);
        return installed ? [{ id: framework.id, name: framework.name, version: all[installed] ?? null }] : [];
      }),
      tooling: TOOLING.filter(
        (tool) =>
          tool.packages.some((name) => all[name] !== undefined) ||
          (tool.files !== undefined && ownFiles.some((file) => tool.files!.test(directory === "." ? file.path : file.path.slice(prefix.length)))),
      ).map((tool) => tool.id),
      entryPoints: entryPointsOf(directory, manifest, paths, snapshot.read),
      parseError: error,
    };
  });

  return {
    totalFiles: snapshot.files.length,
    totalBytes,
    textFiles,
    languages: [...languages.values()].sort((left, right) => right.bytes - left.bytes || (left.language < right.language ? -1 : 1)),
    packageManager: {
      manager: (declaredName && ["npm", "pnpm", "yarn", "bun"].includes(declaredName) ? declaredName : managers[0]) ?? null,
      lockfiles: lockfiles.sort(),
      conflicting: managers.length > 1,
      declared: declaredManager,
    },
    workspaceGlobs,
    packages: packages.sort((left, right) =>
      left.directory === "." ? -1 : right.directory === "." ? 1 : left.directory < right.directory ? -1 : 1,
    ),
    configFiles: snapshot.files.map((file) => file.path).filter((file) => CONFIG_FILE.test(file)),
    environmentFiles: fullSnapshot.files
      .filter((file) => ENVIRONMENT_FILE.test(file.path))
      .map((file) => ({ path: file.path, ignored: file.ignored, tracked: file.tracked })),
    documentation: snapshot.files.map((file) => file.path).filter((file) => DOCUMENTATION.test(file)),
  };
}
