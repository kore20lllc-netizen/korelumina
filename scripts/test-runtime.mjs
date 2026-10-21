import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
 * MS-2026-0008: run every Runtime test, and fail if the run changed the
 * real stores. Tests get isolated temporary roots (F-25); a test that
 * writes to runtime-data or runtime/ is a leak, even when it rewrites a
 * file that already existed, so files are compared by size and mtime.
 *
 *   npm run test:runtime
 *   npm run test:runtime -- src/executive        only tests under a path
 *   --dir <path> --loader none                  run compiled tests (no tsx)
 *
 * Stop Runtime first: Learn now and the Chief Agent write to these
 * stores, and the guard cannot tell their writes from a test's.
 */

const REPOSITORY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNTIME_APP = path.join(REPOSITORY, "apps", "lumina-runtime");
const GUARDED = ["runtime-data", "runtime"];
const UNGUARDED = new Set(["runtime-locks", ".DS_Store"]);

const args = process.argv.slice(2);
const option = (name) => {
  const at = args.indexOf(name);
  if (at === -1) return null;
  const [value] = args.splice(at, 2).slice(1);
  return value;
};
const testRoot = option("--dir") ?? "src";
const loader = option("--loader") ?? "tsx";
const pattern = loader === "none" ? /\.test\.js$/ : /\.test\.tsx?$/;
const filters = args;

function walk(directory, visit) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (UNGUARDED.has(entry.name) || entry.name === "node_modules") continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, visit);
    else if (entry.isFile()) visit(full);
  }
}

function snapshot() {
  const files = new Map();
  for (const store of GUARDED) {
    walk(path.join(REPOSITORY, store), (file) => {
      const stat = fs.statSync(file);
      files.set(path.relative(REPOSITORY, file), `${stat.size}:${stat.mtimeMs}`);
    });
  }
  return files;
}

const tests = [];
walk(path.join(RUNTIME_APP, testRoot), (file) => {
  const relative = path.relative(RUNTIME_APP, file);
  if (!relative.split(path.sep).includes("__tests__") || !pattern.test(relative)) return;
  if (filters.length && !filters.some((filter) => relative.startsWith(filter))) return;
  tests.push(relative);
});
tests.sort();

if (tests.length === 0) {
  console.error(`No Runtime tests found under ${testRoot}${filters.length ? ` matching ${filters.join(", ")}` : ""}.`);
  process.exit(1);
}

const before = snapshot();
const run = spawnSync(
  process.execPath,
  [
    ...(loader === "none" ? [] : ["--import", loader]),
    "--test",
    `--test-concurrency=${Math.max(1, Math.min(8, os.availableParallelism() - 1))}`,
    ...tests,
  ],
  { cwd: RUNTIME_APP, stdio: "inherit", env: { ...process.env, NODE_ENV: "test" } },
);
const after = snapshot();

const changed = [];
for (const [file, stamp] of after) {
  if (!before.has(file)) changed.push(`added    ${file}`);
  else if (before.get(file) !== stamp) changed.push(`changed  ${file}`);
}
for (const file of before.keys()) {
  if (!after.has(file)) changed.push(`removed  ${file}`);
}

if (changed.length) {
  console.error(`\nFAIL: the test run wrote to the real Runtime stores (${changed.length} files):`);
  for (const line of changed.slice(0, 40)) console.error(`  ${line}`);
  if (changed.length > 40) console.error(`  ... and ${changed.length - 40} more`);
  process.exit(1);
}

if (run.status !== 0) {
  process.exit(run.status ?? 1);
}
console.log(`\nPASS: ${tests.length} Runtime test files, and runtime-data and runtime/ are unchanged.`);
