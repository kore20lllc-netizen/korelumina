import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { projectProcessEnvironment } from "../runtime/projectProcessEnvironment.js";
import { createFinding, excerpt, type FindingEvidence, type RepositoryFinding } from "./RepositoryFinding.js";
import type { RepositoryInventory, WorkspacePackage } from "./RepositoryInventory.js";

/*
 * MS-2026-0012: whether the project typechecks and builds, by running its
 * own tools. This runs the project's code, so it is opt-in (the deep
 * audit), runs with the SEC-1 environment allowlist (none of Runtime's
 * secrets), has a time limit, and never installs dependencies itself:
 * installing runs the project's install scripts, which is a separate
 * decision. Without installed dependencies the result says build health
 * was not checked, and why.
 */

export type ProcessRunner = (
  command: string,
  args: readonly string[],
  options: { cwd: string; timeoutMs: number },
) => Promise<{ stdout: string; stderr: string; exitCode: number | null; timedOut: boolean; notFound?: boolean }>;

export const runProjectProcess: ProcessRunner = (command, args, options) =>
  new Promise((resolve) => {
    execFile(
      command,
      [...args],
      {
        cwd: options.cwd,
        timeout: options.timeoutMs,
        maxBuffer: 64 * 1024 * 1024,
        env: projectProcessEnvironment({ CI: "1", FORCE_COLOR: "0", NO_COLOR: "1", npm_config_update_notifier: "false" }),
      },
      (error, stdout, stderr) => {
        const failure = error as (NodeJS.ErrnoException & { killed?: boolean; code?: number | string }) | null;
        resolve({
          stdout: String(stdout ?? ""),
          stderr: String(stderr ?? ""),
          exitCode: failure ? (typeof failure.code === "number" ? failure.code : null) : 0,
          timedOut: Boolean(failure?.killed),
          /* The command itself could not be started. */
          notFound: failure?.code === "ENOENT",
        });
      },
    );
  });

export type BuildCheckStatus = "passed" | "failed" | "skipped" | "unavailable";

export interface BuildCheck {
  packageDirectory: string;
  check: "typecheck" | "build";
  status: BuildCheckStatus;
  /* Why it was skipped or unavailable. */
  reason: string | null;
  command: string | null;
  durationMs: number;
  errorCount: number;
}

export interface BuildHealth {
  checks: BuildCheck[];
  findings: RepositoryFinding[];
}

const MAX_TYPE_ERRORS = 200;
const TYPE_ERROR = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/;
/* file:line:col as printed by Vite, esbuild, Rollup, webpack, Next and most bundlers. */
const LOCATED = /(?:^|[\s(\["'])((?:\.{0,2}\/)?[\w@.\-/\\]+\.(?:[cm]?[jt]sx?|vue|svelte|astro|css|scss|json|html)):(\d+)(?::(\d+))?/g;
const ANSI = /\u001b\[[0-9;]*[A-Za-z]/g;
/*
 * Native build tools ship one package per platform. When node_modules was
 * installed for another platform, the build cannot start: that is the
 * environment, not the project.
 */
const PLATFORM_MISMATCH =
  /Cannot find module ['"]?(@rollup\/rollup-[\w-]+|@esbuild\/[\w-]+|@swc\/core-[\w-]+|lightningcss-[\w-]+|@img\/sharp-[\w-]+|@tailwindcss\/oxide-[\w-]+)|You installed esbuild for another platform|Could not load the "sharp" module/;
/* The first line that states an error, ahead of stack frames and source excerpts. */
const ERROR_LINE = /^\s*(?:Error:|error:|error TS\d+|\[ERROR\]|✘ \[ERROR\]|\[vite\]: Rollup failed|Build failed|SyntaxError:|TypeError:|ReferenceError:|Module not found:|Failed to compile)/;

function relativeTo(root: string, packageDirectory: string, file: string): string {
  const absolute = path.isAbsolute(file) ? file : path.join(root, packageDirectory, file);
  return path.relative(root, absolute).split(path.sep).join("/");
}

function readJsonc(file: string): Record<string, unknown> | null {
  try {
    const text = readFileSync(file, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:"'])\/\/.*$/gm, "$1")
      .replace(/,(\s*[}\]])/g, "$1");
    const value = JSON.parse(text);
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/* The tsconfig files that actually contain code: a solution file with references delegates to them. */
export function typecheckProjects(packageRoot: string): string[] {
  const main = path.join(packageRoot, "tsconfig.json");
  if (!existsSync(main)) return [];
  const config = readJsonc(main);
  const references = Array.isArray(config?.references) ? (config!.references as { path?: unknown }[]) : [];
  const delegates = Array.isArray(config?.files) && (config!.files as unknown[]).length === 0 && !config?.include;
  if (references.length > 0 && delegates) {
    return references
      .map((reference) => (typeof reference.path === "string" ? reference.path : null))
      .filter((reference): reference is string => reference !== null)
      .map((reference) => (reference.endsWith(".json") ? reference : path.join(reference, "tsconfig.json")))
      .filter((reference) => existsSync(path.join(packageRoot, reference)))
      .sort();
  }
  return ["tsconfig.json"];
}

function installedBinary(root: string, packageDirectory: string, name: string): string | null {
  for (const base of [path.join(root, packageDirectory), root]) {
    const candidate = path.join(base, "node_modules", ".bin", name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function hasInstalledDependencies(root: string, entry: WorkspacePackage): boolean {
  const declared = Object.keys({ ...entry.dependencies, ...entry.devDependencies });
  if (declared.length === 0) return true;
  return [path.join(root, entry.directory, "node_modules"), path.join(root, "node_modules")].some((directory) => existsSync(directory));
}

export async function checkBuildHealth(
  root: string,
  inventory: RepositoryInventory,
  options: { run?: ProcessRunner; typecheckTimeoutMs?: number; buildTimeoutMs?: number } = {},
): Promise<BuildHealth> {
  const run = options.run ?? runProjectProcess;
  const checks: BuildCheck[] = [];
  const findings: RepositoryFinding[] = [];
  const manager = inventory.packageManager.manager ?? "npm";
  /* In a workspace monorepo the root package is tooling; its members are the products. */
  const targets = inventory.packages.filter((entry) => inventory.packages.length === 1 || entry.directory !== "." || Object.keys(entry.scripts).includes("build"));

  for (const entry of targets) {
    const packageRoot = path.join(root, entry.directory);
    if (!hasInstalledDependencies(root, entry)) {
      for (const check of ["typecheck", "build"] as const) {
        checks.push({ packageDirectory: entry.directory, check, status: "unavailable", reason: "dependencies are not installed", command: null, durationMs: 0, errorCount: 0 });
      }
      continue;
    }

    /* Typecheck. */
    const projects = entry.tooling.includes("typescript") ? typecheckProjects(packageRoot) : [];
    const tsc = installedBinary(root, entry.directory, "tsc");
    if (projects.length === 0) {
      checks.push({ packageDirectory: entry.directory, check: "typecheck", status: "skipped", reason: "no TypeScript configuration", command: null, durationMs: 0, errorCount: 0 });
    } else if (!tsc) {
      checks.push({ packageDirectory: entry.directory, check: "typecheck", status: "unavailable", reason: "TypeScript is not installed", command: null, durationMs: 0, errorCount: 0 });
    } else {
      const started = Date.now();
      const errors: { file: string; line: number; code: string; message: string }[] = [];
      let timedOut = false;
      let crashed: string | null = null;
      for (const project of projects) {
        const result = await run(tsc, ["--noEmit", "--pretty", "false", "-p", project], { cwd: packageRoot, timeoutMs: options.typecheckTimeoutMs ?? 300_000 });
        timedOut ||= result.timedOut;
        const output = `${result.stdout}\n${result.stderr}`.replace(ANSI, "");
        const before = errors.length;
        for (const line of output.split("\n")) {
          const match = line.match(TYPE_ERROR);
          if (match) errors.push({ file: relativeTo(root, entry.directory, match[1]!), line: Number(match[2]), code: match[4]!, message: match[5]!.trim() });
        }
        if (result.exitCode !== 0 && !result.timedOut && errors.length === before) {
          crashed = output.trim().split("\n").slice(-3).join(" ").slice(0, 300) || `exit code ${result.exitCode}`;
        }
      }
      const command = projects.map((project) => `tsc --noEmit -p ${project}`).join(" && ");
      const status: BuildCheckStatus = timedOut || crashed ? "unavailable" : errors.length > 0 ? "failed" : "passed";
      checks.push({
        packageDirectory: entry.directory,
        check: "typecheck",
        status,
        reason: timedOut ? "the typecheck did not finish in time" : crashed ? `the typecheck could not run: ${crashed}` : null,
        command,
        durationMs: Date.now() - started,
        errorCount: errors.length,
      });
      const seen = new Set<string>();
      for (const error of errors.slice(0, MAX_TYPE_ERRORS)) {
        const identity = `${error.file}\0${error.line}\0${error.code}\0${error.message}`;
        if (seen.has(identity)) continue;
        seen.add(identity);
        findings.push(
          createFinding({
            identity,
            rule: "build.type-error",
            category: "build",
            severity: "high",
            title: `${error.code} in ${error.file}`,
            detail: error.message,
            packageDirectory: entry.directory,
            evidence: [{ file: error.file, line: error.line }],
            remedy: null,
          }),
        );
      }
      if (errors.length > MAX_TYPE_ERRORS) {
        findings.push(
          createFinding({
            identity: entry.directory,
            rule: "build.type-errors-truncated",
            category: "build",
            severity: "info",
            title: `${errors.length - MAX_TYPE_ERRORS} more type errors in ${entry.directory === "." ? "the project" : entry.directory}`,
            detail: `The typecheck reported ${errors.length} errors; the first ${MAX_TYPE_ERRORS} are listed.`,
            packageDirectory: entry.directory,
            evidence: [{ file: entry.manifest }],
            remedy: null,
          }),
        );
      }
    }

    /* Build. */
    if (!entry.scripts.build) {
      checks.push({ packageDirectory: entry.directory, check: "build", status: "skipped", reason: "no build script", command: null, durationMs: 0, errorCount: 0 });
      continue;
    }
    const started = Date.now();
    const args = ["run", "build"];
    /* The project's package manager first; npm when that one is not installed. */
    let command = manager;
    let result = await run(command, args, { cwd: packageRoot, timeoutMs: options.buildTimeoutMs ?? 600_000 });
    if (result.notFound && manager !== "npm") {
      command = "npm";
      result = await run(command, args, { cwd: packageRoot, timeoutMs: options.buildTimeoutMs ?? 600_000 });
    }
    const output = `${result.stdout}\n${result.stderr}`.replace(ANSI, "");
    if (result.notFound) {
      checks.push({ packageDirectory: entry.directory, check: "build", status: "unavailable", reason: `${manager}${manager === "npm" ? "" : " and npm"} could not be started`, command: `${command} ${args.join(" ")}`, durationMs: Date.now() - started, errorCount: 0 });
      continue;
    }
    if (result.timedOut) {
      checks.push({ packageDirectory: entry.directory, check: "build", status: "unavailable", reason: "the build did not finish in time", command: `${command} ${args.join(" ")}`, durationMs: Date.now() - started, errorCount: 0 });
      continue;
    }
    const platform = result.exitCode !== 0 ? output.match(PLATFORM_MISMATCH) : null;
    if (platform) {
      checks.push({
        packageDirectory: entry.directory,
        check: "build",
        status: "unavailable",
        reason: `dependencies were installed for a different platform (${platform[1] ?? "esbuild"} is missing); reinstall them on this machine`,
        command: `${command} ${args.join(" ")}`,
        durationMs: Date.now() - started,
        errorCount: 0,
      });
      continue;
    }
    const passed = result.exitCode === 0;
    checks.push({ packageDirectory: entry.directory, check: "build", status: passed ? "passed" : "failed", reason: null, command: `${command} ${args.join(" ")}`, durationMs: Date.now() - started, errorCount: passed ? 0 : 1 });
    if (passed) continue;

    const evidence: FindingEvidence[] = [];
    const seen = new Set<string>();
    for (const match of output.matchAll(LOCATED)) {
      if (match[1]!.includes("node_modules")) continue;
      const file = relativeTo(root, entry.directory, match[1]!);
      if (file.startsWith("..")) continue;
      const key = `${file}:${match[2]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      evidence.push({ file, line: Number(match[2]) });
      if (evidence.length >= 5) break;
    }
    const lines = output.split("\n").map((line) => line.trimEnd()).filter((line) => line.trim() && !/^\s*>/.test(line));
    const firstError =
      lines.find((line) => ERROR_LINE.test(line)) ??
      lines.find((line) => /\berror\b|failed|cannot|could not|not found/i.test(line) && !/^\s*at\s/.test(line)) ??
      lines[lines.length - 1] ??
      "";
    findings.push(
      createFinding({
        identity: entry.directory,
        rule: "build.failed",
        category: "build",
        severity: "critical",
        title: `The build of ${entry.directory === "." ? "the project" : entry.directory} fails`,
        detail: `${command} run build exited with code ${result.exitCode}. ${excerpt(firstError)}`,
        packageDirectory: entry.directory,
        evidence: evidence.length > 0 ? evidence : [{ file: entry.manifest }],
        remedy: "Fix the first error reported; later errors often follow from it.",
      }),
    );
  }

  return { checks, findings };
}
