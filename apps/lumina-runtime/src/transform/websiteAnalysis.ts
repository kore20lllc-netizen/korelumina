import fs from "node:fs";
import path from "node:path";

import { walkDirectory } from "@korelumina/platform-sdk";

/*
 * MS-2026-0011 (Transform App -> Website, step 1): what the project is and
 * where website pages can go, read from its files rather than assumed.
 * Three routers are supported, because KoreLumina can place a page and
 * wire its route correctly in them: Next.js App Router, Next.js Pages
 * Router and React Router. Anything else is named and refused plainly.
 */

export type WebsiteFramework = "next-app" | "next-pages" | "react-router";

export interface WebsiteAnalysis {
  supported: boolean;
  reason: string | null;
  framework: WebsiteFramework | null;
  frameworkLabel: string;
  typescript: boolean;
  styling: string[];
  pagesDir: string | null;
  componentsDir: string;
  routerFile: string | null;
  existingRoutes: string[];
  components: string[];
  styleFiles: string[];
  productName: string;
  description: string | null;
}

const SKIP = [".git", "node_modules", ".next", "dist", "build", "out", ".turbo", ".cache", "coverage"];
const CODE = /\.(tsx|jsx|ts|js)$/;

function readJson(file: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isDir(file: string): boolean {
  try {
    return fs.lstatSync(file).isDirectory();
  } catch {
    return false;
  }
}

function exists(file: string): boolean {
  try {
    fs.lstatSync(file);
    return true;
  } catch {
    return false;
  }
}

function readText(file: string, limit = 200_000): string {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.size > limit) return "";
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function files(root: string, dir: string): string[] {
  const base = path.join(root, dir);
  if (!isDir(base)) return [];
  return walkDirectory(base, { relative: true, skipDirectories: SKIP })
    .map((file) => `${dir}/${file}`.replace(/^\.\//, ""))
    .sort();
}

function nextAppRoutes(root: string, dir: string): string[] {
  return files(root, dir)
    .filter((file) => /\/page\.(tsx|jsx|ts|js)$/.test(`/${file}`))
    .map((file) => {
      const segments = file.slice(dir.length + 1).split("/").slice(0, -1);
      const visible = segments.filter((segment) => !/^\(.*\)$/.test(segment) && !segment.startsWith("@"));
      return `/${visible.join("/")}`.replace(/\/$/, "") || "/";
    });
}

function nextPagesRoutes(root: string, dir: string): string[] {
  return files(root, dir)
    .filter((file) => CODE.test(file) && !/\/(_app|_document|_error)\.\w+$/.test(`/${file}`) && !file.slice(dir.length + 1).startsWith("api/"))
    .map((file) => {
      const route = `/${file.slice(dir.length + 1).replace(CODE, "")}`.replace(/\/index$/, "");
      return route || "/";
    });
}

const ROUTER_SIGNS = /<Routes\b|createBrowserRouter\s*\(|createHashRouter\s*\(|useRoutes\s*\(|createRoutesFromElements\s*\(/;

function findRouterFile(root: string): string | null {
  const candidates = files(root, "src").filter((file) => CODE.test(file));
  const preferred = ["src/App.tsx", "src/App.jsx", "src/router.tsx", "src/routes.tsx", "src/main.tsx", "src/main.jsx"];
  for (const file of [...preferred, ...candidates]) {
    if (candidates.includes(file) && ROUTER_SIGNS.test(readText(path.join(root, file)))) return file;
  }
  return null;
}

function reactRouterRoutes(source: string): string[] {
  const routes = new Set<string>();
  for (const match of source.matchAll(/\bpath\s*[=:]\s*\{?\s*["'`]([^"'`]+)["'`]/g)) {
    const route = match[1].startsWith("/") ? match[1] : `/${match[1]}`;
    routes.add(route === "/*" ? "/*" : route.replace(/\/$/, "") || "/");
  }
  for (const match of source.matchAll(/<Route\b[^>]*\bindex\b/g)) {
    if (match[0]) routes.add("/");
  }
  return [...routes].sort();
}

const UNSUPPORTED: Array<[string, string]> = [
  ["nuxt", "Nuxt"],
  ["vue", "Vue"],
  ["@sveltejs/kit", "SvelteKit"],
  ["svelte", "Svelte"],
  ["astro", "Astro"],
  ["@remix-run/react", "Remix"],
  ["@angular/core", "Angular"],
  ["gatsby", "Gatsby"],
  ["solid-js", "Solid"],
];

function readmeDescription(readme: string): { title: string | null; description: string | null } {
  const title = readme.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null;
  const paragraph = readme
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith("#") && !block.startsWith("![") && !block.startsWith("[!") && !block.startsWith("<") && block.length > 30);
  return { title, description: paragraph ? paragraph.replace(/\s+/g, " ").slice(0, 400) : null };
}

export function analyzeWebsiteTarget(projectPath: string): WebsiteAnalysis {
  const root = path.resolve(projectPath);
  const pkg = readJson(path.join(root, "package.json"));
  const readme = readText(path.join(root, "README.md"), 400_000);
  const fromReadme = readmeDescription(readme);
  const deps = {
    ...((pkg?.dependencies as Record<string, string> | undefined) ?? {}),
    ...((pkg?.devDependencies as Record<string, string> | undefined) ?? {}),
  };

  const styling: string[] = [];
  if (deps.tailwindcss) styling.push("Tailwind CSS");
  if (exists(path.join(root, "components.json"))) styling.push("shadcn/ui");
  if (deps["styled-components"]) styling.push("styled-components");
  if (deps["@emotion/react"]) styling.push("Emotion");
  if (deps["@mui/material"]) styling.push("Material UI");
  if (deps["@chakra-ui/react"]) styling.push("Chakra UI");
  if (deps.sass) styling.push("Sass");

  const componentsDir = isDir(path.join(root, "src/components"))
    ? "src/components"
    : isDir(path.join(root, "components"))
      ? "components"
      : isDir(path.join(root, "src"))
        ? "src/components"
        : "components";

  const base: WebsiteAnalysis = {
    supported: false,
    reason: null,
    framework: null,
    frameworkLabel: "Unknown",
    typescript: exists(path.join(root, "tsconfig.json")),
    styling,
    pagesDir: null,
    componentsDir,
    routerFile: null,
    existingRoutes: [],
    components: files(root, componentsDir).filter((file) => /\.(tsx|jsx)$/.test(file)).slice(0, 120),
    styleFiles: [
      ...["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs", "tailwind.config.cjs"].filter((file) => exists(path.join(root, file))),
      ...["app/globals.css", "src/app/globals.css", "src/index.css", "src/styles/globals.css", "styles/globals.css", "src/App.css"].filter((file) => exists(path.join(root, file))),
    ],
    productName: (typeof pkg?.name === "string" && pkg.name) || fromReadme.title || path.basename(root),
    description: (typeof pkg?.description === "string" && pkg.description) || fromReadme.description,
  };

  if (!pkg) {
    return { ...base, reason: "This project has no package.json, so it is not a JavaScript web app Transform can add pages to." };
  }

  if (deps.next) {
    const appDir = ["src/app", "app"].find((dir) => isDir(path.join(root, dir)));
    if (appDir) {
      return { ...base, supported: true, framework: "next-app", frameworkLabel: "Next.js (App Router)", pagesDir: appDir, existingRoutes: nextAppRoutes(root, appDir) };
    }
    const pagesDir = ["src/pages", "pages"].find((dir) => isDir(path.join(root, dir)));
    if (pagesDir) {
      return { ...base, supported: true, framework: "next-pages", frameworkLabel: "Next.js (Pages Router)", pagesDir, existingRoutes: nextPagesRoutes(root, pagesDir) };
    }
    return { ...base, frameworkLabel: "Next.js", reason: "This Next.js project has neither an app nor a pages folder." };
  }

  if (deps["react-router-dom"] || deps["react-router"]) {
    const routerFile = findRouterFile(root);
    if (!routerFile) {
      return { ...base, frameworkLabel: "React with React Router", reason: "React Router is installed, but no file under src defines the routes (Routes, createBrowserRouter or useRoutes)." };
    }
    return {
      ...base,
      supported: true,
      framework: "react-router",
      frameworkLabel: "React with React Router",
      pagesDir: "src/pages/site",
      routerFile,
      existingRoutes: reactRouterRoutes(readText(path.join(root, routerFile))),
    };
  }

  for (const [dependency, label] of UNSUPPORTED) {
    if (deps[dependency]) {
      return { ...base, frameworkLabel: label, reason: `${label} projects are not supported by Transform yet. It supports Next.js and React with React Router.` };
    }
  }

  if (deps.react) {
    return { ...base, frameworkLabel: "React", reason: "This React app has no router, so new pages would have no address. Add React Router first; then Transform can add the website pages." };
  }

  return { ...base, reason: "No supported web framework was found. Transform supports Next.js and React with React Router." };
}

function pascal(id: string): string {
  return id
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("") || "Page";
}

/* Where a page for this route is created, decided here rather than by the model. */
export function pageFileFor(analysis: WebsiteAnalysis, route: string, id: string): string {
  const ext = analysis.typescript ? "tsx" : "jsx";
  const segments = route.split("/").filter(Boolean);
  if (analysis.framework === "next-app") {
    return [analysis.pagesDir, ...segments, `page.${ext}`].join("/");
  }
  if (analysis.framework === "next-pages") {
    return segments.length === 0 ? `${analysis.pagesDir}/index.${ext}` : `${analysis.pagesDir}/${segments.join("/")}.${ext}`;
  }
  return `${analysis.pagesDir}/${pascal(id)}Page.${ext}`;
}

export function componentNameFor(id: string): string {
  return `${pascal(id)}Page`;
}

export function siteLayoutFile(analysis: WebsiteAnalysis): string {
  return `${analysis.componentsDir}/site/SiteLayout.${analysis.typescript ? "tsx" : "jsx"}`;
}

/* An import specifier from one project file to another, without extension. */
export function importPath(fromFile: string, toFile: string): string {
  let relative = path.posix.relative(path.posix.dirname(fromFile), toFile).replace(/\.(tsx|jsx|ts|js)$/, "");
  if (!relative.startsWith(".")) relative = `./${relative}`;
  return relative;
}
