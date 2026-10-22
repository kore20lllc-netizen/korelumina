import path from "node:path";

import { ARCHIVED_PATH } from "./DependencyAnalysis.js";
import { createFinding, type FindingEvidence, type RepositoryFinding } from "./RepositoryFinding.js";
import type { RepositoryInventory, WorkspacePackage } from "./RepositoryInventory.js";
import type { RepositorySnapshot } from "./RepositorySnapshot.js";
import { SOURCE_EXTENSIONS, scanSource } from "./SourceImports.js";

/*
 * MS-2026-0012: the environment variables a project reads, compared with
 * what it documents. Only names are read and reported, never values.
 */

export interface EnvironmentVariableUse {
  name: string;
  packageDirectory: string;
  /* Exposed to browser code by the bundler's public prefix. */
  public: boolean;
  documented: boolean;
  reads: FindingEvidence[];
}

export interface EnvironmentAnalysis {
  variables: EnvironmentVariableUse[];
  /* Example files the names were documented in. */
  templates: string[];
  findings: RepositoryFinding[];
}

/* Whitespace and line breaks are allowed around the dots: code is often formatted vertically. */
const READS: readonly RegExp[] = [
  /\bprocess\s*\.\s*env\s*\.\s*([A-Z_][A-Z0-9_]*)\b/g,
  /\bprocess\s*\.\s*env\s*\[\s*["'`]([A-Z_][A-Z0-9_]*)["'`]\s*\]/g,
  /\bimport\s*\.\s*meta\s*\.\s*env\s*\.\s*([A-Z_][A-Z0-9_]*)\b/g,
  /\bimport\s*\.\s*meta\s*\.\s*env\s*\[\s*["'`]([A-Z_][A-Z0-9_]*)["'`]\s*\]/g,
  /\bDeno\s*\.\s*env\s*\.\s*get\(\s*["'`]([A-Z_][A-Z0-9_]*)["'`]\s*\)/g,
  /\bBun\s*\.\s*env\s*\.\s*([A-Z_][A-Z0-9_]*)\b/g,
];

/* Set by the platform, the bundler or the shell rather than the project. */
const PROVIDED = new Set([
  "NODE_ENV", "MODE", "DEV", "PROD", "SSR", "BASE_URL", "CI", "HOME", "PATH", "PWD", "TZ", "LANG", "TMPDIR", "USER", "SHELL",
  "PORT", "HOST", "HOSTNAME", "VERCEL", "VERCEL_ENV", "VERCEL_URL", "NETLIFY", "DEBUG", "NODE_OPTIONS", "npm_lifecycle_event",
  "npm_package_version", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_DB_URL",
]);
/* Supabase Edge Functions receive SUPABASE_* automatically; only there are they provided. */
const EDGE_FUNCTION = /(^|\/)supabase\/functions\//;
const PUBLIC_PREFIX = /^(VITE_|NEXT_PUBLIC_|PUBLIC_|REACT_APP_|NUXT_PUBLIC_|EXPO_PUBLIC_|GATSBY_|STORYBOOK_)/;
const SECRET_NAME = /(SECRET|PRIVATE_KEY|PRIVATE|SERVICE_ROLE|SERVICE_KEY|PASSWORD|PASSWD|DB_URL|DATABASE_URL|WEBHOOK_SECRET|SIGNING_KEY)/;
const TEMPLATE = /(^|\/)\.env\.(example|sample|template|defaults|dist)$|(^|\/)(example|sample)\.env$/;
const ENV_FILE = /(^|\/)\.env(\.[\w.-]+)?$/;
const TEST_PATH = /(^|\/)(__tests__|tests?|e2e)(\/|$)|\.(test|spec)\.[cm]?[jt]sx?$/;

function owner(file: string, packages: readonly WorkspacePackage[]): string {
  let best = ".";
  for (const entry of packages) if (entry.directory !== "." && file.startsWith(`${entry.directory}/`) && entry.directory.length > best.length) best = entry.directory;
  return best;
}

/* Variable names assigned in a dotenv file. */
export function dotenvNames(text: string): string[] {
  const names = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) names.add(match[1]!);
  }
  return [...names].sort();
}

export function analyzeEnvironment(snapshot: RepositorySnapshot, inventory: RepositoryInventory): EnvironmentAnalysis {
  const uses = new Map<string, EnvironmentVariableUse>();
  const live = new Set<string>();

  for (const file of snapshot.files) {
    if (file.ignored || !file.text || !SOURCE_EXTENSIONS.has(path.posix.extname(file.path).toLowerCase())) continue;
    if (ARCHIVED_PATH.test(file.path)) continue;
    const text = snapshot.read(file.path);
    if (!text) continue;
    const { code, inString } = scanSource(text);
    const lineStarts = [0];
    for (let index = 0; index < code.length; index += 1) if (code.charCodeAt(index) === 10) lineStarts.push(index + 1);
    const lineOf = (offset: number) => {
      let low = 0;
      let high = lineStarts.length - 1;
      while (low < high) {
        const middle = (low + high + 1) >> 1;
        if (lineStarts[middle]! <= offset) low = middle;
        else high = middle - 1;
      }
      return low + 1;
    };
    const directory = owner(file.path, inventory.packages);
    for (const expression of READS) {
      for (const match of code.matchAll(expression)) {
        /* Text inside a string literal (a fixture, generated code) is not a read. */
        if (inString[match.index!]) continue;
        const name = match[1]!;
        if (PROVIDED.has(name) && !(name.startsWith("SUPABASE_") && !EDGE_FUNCTION.test(file.path))) continue;
        const key = `${directory}\0${name}`;
        const use = uses.get(key) ?? { name, packageDirectory: directory, public: PUBLIC_PREFIX.test(name), documented: false, reads: [] };
        if (use.reads.length < 5) use.reads.push({ file: file.path, line: lineOf(match.index!) });
        if (!TEST_PATH.test(file.path)) live.add(key);
        uses.set(key, use);
      }
    }
  }

  /* Documented names: example files anywhere, plus committed env files (names only). */
  const templates = snapshot.files.filter((file) => !file.ignored && TEMPLATE.test(file.path)).map((file) => file.path).sort();
  const documented = new Map<string, Set<string>>();
  for (const file of snapshot.files) {
    if (file.ignored || !ENV_FILE.test(file.path) && !TEMPLATE.test(file.path)) continue;
    const text = snapshot.readSensitive(file.path);
    if (text === null) continue;
    const directory = owner(file.path, inventory.packages);
    const names = documented.get(directory) ?? new Set<string>();
    for (const name of dotenvNames(text)) names.add(name);
    documented.set(directory, names);
  }
  const isDocumented = (directory: string, name: string) =>
    documented.get(directory)?.has(name) || documented.get(".")?.has(name) || false;
  for (const use of uses.values()) use.documented = isDocumented(use.packageDirectory, use.name);

  const findings: RepositoryFinding[] = [];
  const variables = [...uses.values()].sort((left, right) =>
    left.packageDirectory === right.packageDirectory ? (left.name < right.name ? -1 : 1) : left.packageDirectory < right.packageDirectory ? -1 : 1,
  );

  for (const use of variables) {
    const where = use.packageDirectory === "." ? "the project" : use.packageDirectory;
    if (use.public && SECRET_NAME.test(use.name)) {
      findings.push(
        createFinding({
          identity: `${use.packageDirectory}\0${use.name}`,
          rule: "environment.secret-in-browser",
          category: "environment",
          severity: "high",
          title: `${use.name} is a secret exposed to the browser`,
          detail: `The bundler copies every ${use.name.match(PUBLIC_PREFIX)![1]} variable into the JavaScript it ships, so anyone who loads the page can read ${use.name}. Its name says it is secret.`,
          packageDirectory: use.packageDirectory,
          evidence: use.reads,
          remedy: `Keep the value on a server (an API route or edge function) and give it a name without the ${use.name.match(PUBLIC_PREFIX)![1]} prefix.`,
        }),
      );
    }
  }

  const hasTemplate = templates.length > 0;
  const undocumented = variables.filter((use) => !use.documented && live.has(`${use.packageDirectory}\0${use.name}`));
  if (!hasTemplate && undocumented.length > 0) {
    findings.push(
      createFinding({
        identity: "no-template",
        rule: "environment.no-example-file",
        category: "environment",
        severity: "medium",
        title: `${undocumented.length} environment variable${undocumented.length === 1 ? " is" : "s are"} read, and no example file documents them`,
        detail: `The code reads ${undocumented.map((use) => use.name).slice(0, 12).join(", ")}${undocumented.length > 12 ? ", ..." : ""}, but there is no .env.example. Anyone setting the project up has to find them in the code.`,
        packageDirectory: ".",
        evidence: undocumented.slice(0, 10).map((use) => use.reads[0]!),
        remedy: "Commit a .env.example listing every variable with an empty or placeholder value.",
      }),
    );
  } else {
    for (const use of undocumented) {
      findings.push(
        createFinding({
          identity: `${use.packageDirectory}\0${use.name}`,
          rule: "environment.undocumented",
          category: "environment",
          severity: "low",
          title: `${use.name} is read but not in any example file`,
          detail: `${use.packageDirectory === "." ? "The project" : use.packageDirectory} reads ${use.name}, but no example file lists it, so a new setup will miss it.`,
          packageDirectory: use.packageDirectory,
          evidence: use.reads,
          remedy: `Add ${use.name}= to the example file.`,
        }),
      );
    }
  }

  for (const template of templates) {
    const text = snapshot.read(template) ?? "";
    const directory = owner(template, inventory.packages);
    for (const name of dotenvNames(text)) {
      const readHere = variables.some((use) => use.name === name && (use.packageDirectory === directory || directory === "."));
      if (readHere || PROVIDED.has(name)) continue;
      findings.push(
        createFinding({
          identity: `${template}\0${name}`,
          rule: "environment.unused",
          category: "environment",
          severity: "info",
          title: `${name} is documented but nothing reads it`,
          detail: `${template} lists ${name}, but no code in ${directory === "." ? "the project" : directory} reads it. It may be read by a tool through its own configuration, or be left over.`,
          packageDirectory: directory,
          evidence: [{ file: template }],
          remedy: `Remove ${name} from ${template} if nothing uses it.`,
        }),
      );
    }
  }

  return { variables, templates, findings };
}
