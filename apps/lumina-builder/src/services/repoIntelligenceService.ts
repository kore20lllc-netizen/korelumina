import { AppError } from "@/lib/errors";

export type RepoFramework =
  | "next"
  | "vite"
  | "react"
  | "vue"
  | "svelte"
  | "astro"
  | "remix"
  | "unknown";

export type RepoFileKind =
  | "page"
  | "component"
  | "hook"
  | "service"
  | "api"
  | "config"
  | "style"
  | "test"
  | "asset"
  | "data"
  | "unknown";

export interface RepoFileNode {
  path: string;
  kind: RepoFileKind;
  extension: string;
  imports: string[];
  exports: string[];
  symbols: string[];
  route?: string;
}

export interface RepoDependencyNode {
  name: string;
  version: string;
  dev: boolean;
}

export interface RepoEnvNode {
  key: string;
  files: string[];
}

export interface RepoGraphEdge {
  from: string;
  to: string;
  type: "imports" | "defines-route" | "uses-env" | "declares-dependency" | "belongs-to-domain";
}

export interface RepoDomainNode {
  name: string;
  files: string[];
  routes: string[];
  components: string[];
  services: string[];
  apiEndpoints: string[];
}

export interface RepoKnowledgeGraph {
  projectId: string;
  generatedAt: string;
  framework: RepoFramework;
  packageManager: "npm" | "pnpm" | "yarn" | "bun" | "unknown";
  entryFiles: string[];
  files: RepoFileNode[];
  dependencies: RepoDependencyNode[];
  env: RepoEnvNode[];
  domains: RepoDomainNode[];
  edges: RepoGraphEdge[];
  summary: {
    fileCount: number;
    dependencyCount: number;
    routeCount: number;
    componentCount: number;
    apiCount: number;
    envCount: number;
    domainCount: number;
  };
}

const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".astro",
]);

const STYLE_EXTENSIONS = new Set([
  ".css",
  ".scss",
  ".sass",
  ".less",
]);

const ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".mp4",
  ".webm",
  ".woff",
  ".woff2",
]);

function extensionOf(path: string) {
  const match = path.match(/(\.[a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? "";
}

function normalizePath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\.?\//, "");
}

function parsePackageJson(files: Record<string, string>) {
  const raw = files["package.json"];
  if (!raw) return null;

  try {
    return JSON.parse(raw) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
  } catch {
    return null;
  }
}

function detectPackageManager(files: Record<string, string>): RepoKnowledgeGraph["packageManager"] {
  if (files["pnpm-lock.yaml"]) return "pnpm";
  if (files["yarn.lock"]) return "yarn";
  if (files["bun.lock"] || files["bun.lockb"]) return "bun";
  if (files["package-lock.json"]) return "npm";
  return "unknown";
}

function detectFramework(files: Record<string, string>, pkg: ReturnType<typeof parsePackageJson>): RepoFramework {
  const deps = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
  };

  if (files["next.config.js"] || files["next.config.mjs"] || files["next.config.ts"] || deps.next) return "next";
  if (files["vite.config.ts"] || files["vite.config.js"] || files["vite.config.mjs"] || deps.vite) return "vite";
  if (files["astro.config.mjs"] || deps.astro) return "astro";
  if (files["svelte.config.js"] || deps["@sveltejs/kit"] || deps.svelte) return "svelte";
  if (deps["@remix-run/react"] || deps["@remix-run/node"]) return "remix";
  if (deps.vue) return "vue";
  if (deps.react || deps["react-dom"]) return "react";

  return "unknown";
}

function dependenciesFromPackage(pkg: ReturnType<typeof parsePackageJson>): RepoDependencyNode[] {
  if (!pkg) return [];

  return [
    ...Object.entries(pkg.dependencies ?? {}).map(([name, version]) => ({
      name,
      version,
      dev: false,
    })),
    ...Object.entries(pkg.devDependencies ?? {}).map(([name, version]) => ({
      name,
      version,
      dev: true,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));
}

function parseImports(content: string) {
  const imports = new Set<string>();
  const patterns = [
    /import\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g,
    /export\s+(?:type\s+)?[^'"]+\s+from\s+["']([^"']+)["']/g,
    /require\(["']([^"']+)["']\)/g,
    /import\(["']([^"']+)["']\)/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content))) {
      imports.add(match[1]);
    }
  }

  return [...imports].sort();
}

function parseExports(content: string) {
  const exports = new Set<string>();
  const patterns = [
    /export\s+(?:default\s+)?function\s+([A-Za-z0-9_$]+)/g,
    /export\s+const\s+([A-Za-z0-9_$]+)/g,
    /export\s+class\s+([A-Za-z0-9_$]+)/g,
    /export\s+interface\s+([A-Za-z0-9_$]+)/g,
    /export\s+type\s+([A-Za-z0-9_$]+)/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content))) {
      exports.add(match[1]);
    }
  }

  if (/export\s+default\b/.test(content)) {
    exports.add("default");
  }

  return [...exports].sort();
}

function parseSymbols(content: string) {
  const symbols = new Set<string>();
  const patterns = [
    /function\s+([A-Z_a-z][A-Z_a-z0-9]*)/g,
    /const\s+([A-Z][A-Z_a-z0-9]*)\s*=/g,
    /class\s+([A-Z_a-z][A-Z_a-z0-9]*)/g,
    /interface\s+([A-Z_a-z][A-Z_a-z0-9]*)/g,
    /type\s+([A-Z_a-z][A-Z_a-z0-9]*)\s*=/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content))) {
      symbols.add(match[1]);
    }
  }

  return [...symbols].sort();
}

function routeFromPath(path: string, framework: RepoFramework) {
  const normalized = normalizePath(path);

  if (framework === "next") {
    const appMatch = normalized.match(/^app\/(.+)\/page\.(tsx|ts|jsx|js)$/);
    if (appMatch) {
      const route = appMatch[1]
        .replace(/\(.*?\)\//g, "")
        .replace(/\[([^\]]+)\]/g, ":$1");
      return route === "page" ? "/" : `/${route}`;
    }

    if (/^app\/page\.(tsx|ts|jsx|js)$/.test(normalized)) return "/";

    const pagesMatch = normalized.match(/^pages\/(.+)\.(tsx|ts|jsx|js)$/);
    if (pagesMatch) {
      const route = pagesMatch[1]
        .replace(/index$/, "")
        .replace(/\[([^\]]+)\]/g, ":$1");
      return `/${route}`.replace(/\/$/, "") || "/";
    }
  }

  if (normalized.match(/^src\/pages\/.+\.(tsx|ts|jsx|js|vue|svelte|astro)$/)) {
    const route = normalized
      .replace(/^src\/pages\//, "")
      .replace(/\.(tsx|ts|jsx|js|vue|svelte|astro)$/, "")
      .replace(/index$/, "");
    return `/${route}`.replace(/\/$/, "") || "/";
  }

  return undefined;
}

function classifyFile(path: string, content: string, framework: RepoFramework): RepoFileKind {
  const normalized = normalizePath(path);
  const ext = extensionOf(normalized);

  if (routeFromPath(normalized, framework)) return "page";
  if (normalized.includes("/api/") || normalized.match(/^app\/api\//) || normalized.match(/^pages\/api\//)) return "api";
  if (normalized.match(/(^|\/)(components?|ui)\//i) || /export\s+(?:default\s+)?function\s+[A-Z]/.test(content)) return "component";
  if (normalized.match(/(^|\/)hooks?\//i) || normalized.match(/use[A-Z][A-Za-z0-9]+/)) return "hook";
  if (normalized.match(/(^|\/)(services?|lib|utils|api)\//i)) return "service";
  if (normalized.match(/config\.(ts|js|mjs|cjs)$/) || normalized.includes("tsconfig") || normalized.includes("tailwind.config")) return "config";
  if (STYLE_EXTENSIONS.has(ext)) return "style";
  if (normalized.match(/(\.test|\.spec)\.(ts|tsx|js|jsx)$/)) return "test";
  if (ASSET_EXTENSIONS.has(ext)) return "asset";
  if (normalized.endsWith(".json") || normalized.endsWith(".yml") || normalized.endsWith(".yaml")) return "data";

  return SOURCE_EXTENSIONS.has(ext) ? "service" : "unknown";
}


function domainNameForPath(path: string) {
  const normalized = normalizePath(path).toLowerCase();

  const rules: { name: string; patterns: RegExp[] }[] = [
    {
      name: "auth",
      patterns: [/auth/, /login/, /signup/, /session/, /supabase/, /password/],
    },
    {
      name: "billing",
      patterns: [/billing/, /checkout/, /stripe/, /invoice/, /subscription/, /pricing/],
    },
    {
      name: "admin",
      patterns: [/admin/, /users?/, /roles?/, /permissions?/],
    },
    {
      name: "dashboard",
      patterns: [/dashboard/, /analytics/, /metrics/, /reports?/],
    },
    {
      name: "settings",
      patterns: [/settings/, /preferences/, /profile/],
    },
    {
      name: "api",
      patterns: [/\/api\//, /^api\//, /^app\/api\//, /^pages\/api\//],
    },
    {
      name: "runtime",
      patterns: [/runtime/, /preview/, /vite/, /server/],
    },
    {
      name: "content",
      patterns: [/blog/, /docs?/, /cms/, /markdown/, /content/],
    },
  ];

  for (const rule of rules) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.name;
    }
  }

  const parts = normalized.split("/");
  const srcIndex = parts.indexOf("src");
  if (srcIndex >= 0 && parts[srcIndex + 1]) {
    const candidate = parts[srcIndex + 1];
    if (!["components", "lib", "utils", "hooks", "services", "styles", "assets"].includes(candidate)) {
      return candidate;
    }
  }

  if (parts[0] === "app" && parts[1]) return parts[1].replace(/[()[\]]/g, "") || "app";
  if (parts[0] === "pages" && parts[1]) return parts[1].replace(/[()[\]]/g, "") || "pages";

  return "core";
}

function buildDomains(fileNodes: RepoFileNode[]): RepoDomainNode[] {
  const map = new Map<string, RepoDomainNode>();

  const ensure = (name: string) => {
    const key = name || "core";
    const existing = map.get(key);
    if (existing) return existing;

    const created: RepoDomainNode = {
      name: key,
      files: [],
      routes: [],
      components: [],
      services: [],
      apiEndpoints: [],
    };

    map.set(key, created);
    return created;
  };

  for (const file of fileNodes) {
    const domain = ensure(domainNameForPath(file.path));

    domain.files.push(file.path);

    if (file.route) domain.routes.push(file.route);
    if (file.kind === "component") domain.components.push(file.path);
    if (file.kind === "service") domain.services.push(file.path);
    if (file.kind === "api") domain.apiEndpoints.push(file.path);
  }

  return [...map.values()]
    .map((domain) => ({
      ...domain,
      files: domain.files.sort(),
      routes: [...new Set(domain.routes)].sort(),
      components: domain.components.sort(),
      services: domain.services.sort(),
      apiEndpoints: domain.apiEndpoints.sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function parseEnvUsage(files: Record<string, string>) {
  const envMap = new Map<string, Set<string>>();
  const patterns = [
    /import\.meta\.env\.([A-Z0-9_]+)/g,
    /process\.env\.([A-Z0-9_]+)/g,
  ];

  for (const [path, content] of Object.entries(files)) {
    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content))) {
        const key = match[1];
        if (!envMap.has(key)) envMap.set(key, new Set());
        envMap.get(key)?.add(path);
      }
    }
  }

  return [...envMap.entries()]
    .map(([key, fileSet]) => ({
      key,
      files: [...fileSet].sort(),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function entryFiles(files: Record<string, string>, framework: RepoFramework) {
  const candidates = [
    "app/page.tsx",
    "app/page.ts",
    "pages/index.tsx",
    "pages/index.ts",
    "src/main.tsx",
    "src/main.ts",
    "src/App.tsx",
    "src/App.ts",
    "main.tsx",
    "main.ts",
  ];

  const found = candidates.filter((path) => files[path]);

  if (found.length > 0) return found;

  if (framework === "next") {
    return Object.keys(files).filter((path) => routeFromPath(path, framework));
  }

  return [];
}

function buildRepoKnowledgeGraphFromFileMap(
  projectId: string,
  rawFiles: Record<string, string>,
): RepoKnowledgeGraph {
  const files = Object.fromEntries(
    Object.entries(rawFiles).map(([path, content]) => [
      normalizePath(path),
      content,
    ]),
  );

  const pkg = parsePackageJson(files);
  const framework = detectFramework(files, pkg);
  const dependencies = dependenciesFromPackage(pkg);
  const env = parseEnvUsage(files);

  const fileNodes: RepoFileNode[] = Object.entries(files)
    .map(([path, content]) => {
      const extension = extensionOf(path);
      const route = routeFromPath(path, framework);

      return {
        path,
        kind: classifyFile(path, content, framework),
        extension,
        imports: SOURCE_EXTENSIONS.has(extension) ? parseImports(content) : [],
        exports: SOURCE_EXTENSIONS.has(extension) ? parseExports(content) : [],
        symbols: SOURCE_EXTENSIONS.has(extension) ? parseSymbols(content) : [],
        route,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const domains = buildDomains(fileNodes);
  const edges: RepoGraphEdge[] = [];

  for (const domain of domains) {
    for (const file of domain.files) {
      edges.push({ from: file, to: domain.name, type: "belongs-to-domain" });
    }
  }

  for (const file of fileNodes) {
    for (const imported of file.imports) {
      edges.push({ from: file.path, to: imported, type: "imports" });
    }

    if (file.route) {
      edges.push({ from: file.path, to: file.route, type: "defines-route" });
    }

    for (const envVar of env) {
      if (envVar.files.includes(file.path)) {
        edges.push({ from: file.path, to: envVar.key, type: "uses-env" });
      }
    }
  }

  for (const dependency of dependencies) {
    edges.push({
      from: "package.json",
      to: dependency.name,
      type: "declares-dependency",
    });
  }

  return {
    projectId,
    generatedAt: new Date().toISOString(),
    framework,
    packageManager: detectPackageManager(files),
    entryFiles: entryFiles(files, framework),
    files: fileNodes,
    dependencies,
    env,
    domains,
    edges,
    summary: {
      fileCount: fileNodes.length,
      dependencyCount: dependencies.length,
      routeCount: fileNodes.filter((file) => file.route).length,
      componentCount: fileNodes.filter((file) => file.kind === "component").length,
      apiCount: fileNodes.filter((file) => file.kind === "api").length,
      envCount: env.length,
      domainCount: domains.length,
    },
  };
}

export function buildRepoKnowledgeGraphFromFiles(
  projectId: string,
  files: Record<string, string>,
): RepoKnowledgeGraph {
  return buildRepoKnowledgeGraphFromFileMap(projectId, files);
}

