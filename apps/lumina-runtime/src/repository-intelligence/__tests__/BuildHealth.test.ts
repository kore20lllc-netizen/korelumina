import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  checkBuildHealth,
  runProjectProcess,
  takeRepositoryInventory,
  takeRepositorySnapshot,
  typecheckProjects,
  type ProcessRunner,
} from "../index.js";

/* MS-2026-0012: build health runs the project's own tools, safely. */

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-build-health-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

const VITE_APP = {
  "package.json": JSON.stringify({ name: "app", scripts: { build: "vite build" }, devDependencies: { typescript: "^5", vite: "^5" } }),
  "package-lock.json": "{}",
  "tsconfig.json": '{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }] }',
  "tsconfig.app.json": '{ "include": ["src"] }',
  "tsconfig.node.json": '{ "include": ["vite.config.ts"] }',
  "src/main.ts": "export {};\n",
  "node_modules/.bin/tsc": "",
};

function health(files: Record<string, string>, run: ProcessRunner) {
  const root = repository(files);
  const snapshot = takeRepositorySnapshot(root);
  return { root, result: checkBuildHealth(root, takeRepositoryInventory(snapshot), { run }) };
}

const ok = { stdout: "", stderr: "", exitCode: 0, timedOut: false };

test("a solution tsconfig is typechecked through its references", () => {
  const root = repository(VITE_APP);
  assert.deepEqual(typecheckProjects(root), ["./tsconfig.app.json", "./tsconfig.node.json"]);
  assert.deepEqual(typecheckProjects(repository({ "tsconfig.json": '{ "include": ["src"] }' })), ["tsconfig.json"]);
  assert.deepEqual(typecheckProjects(repository({})), []);
});

test("type errors become findings with file and line; the build passes", async () => {
  const calls: string[] = [];
  const run: ProcessRunner = async (command, args, options) => {
    calls.push(`${path.basename(command)} ${args.join(" ")}`);
    if (args.includes("./tsconfig.app.json")) {
      return {
        ...ok,
        exitCode: 2,
        stdout: [
          "src/main.ts(3,7): error TS2322: Type 'string' is not assignable to type 'number'.",
          "src/main.ts(3,7): error TS2322: Type 'string' is not assignable to type 'number'.",
          `${path.join(options.cwd, "src", "other.ts")}(10,1): error TS2304: Cannot find name 'missing'.`,
        ].join("\n"),
      };
    }
    return ok;
  };
  const { result } = health(VITE_APP, run);
  const { checks, findings } = await result;
  assert.deepEqual(calls, ["tsc --noEmit --pretty false -p ./tsconfig.app.json", "tsc --noEmit --pretty false -p ./tsconfig.node.json", "npm run build"]);
  assert.deepEqual(checks.map((check) => `${check.check}:${check.status}:${check.errorCount}`), ["typecheck:failed:3", "build:passed:0"]);
  assert.deepEqual(
    findings.map((finding) => `${finding.title} ${finding.evidence[0]!.file}:${finding.evidence[0]!.line}`),
    ["TS2322 in src/main.ts src/main.ts:3", "TS2304 in src/other.ts src/other.ts:10"],
  );
});

test("a failing build names the project files its output points to", async () => {
  const run: ProcessRunner = async (_command, args) =>
    args.includes("build")
      ? {
          ...ok,
          exitCode: 1,
          stderr: [
            "vite v5.4.0 building for production...",
            "✓ 31 modules transformed.",
            "x Build failed in 412ms",
            'error during build:',
            '[vite:esbuild] Transform failed with 1 error:',
            'src/main.ts:4:12: ERROR: Expected ";" but found "x"',
            "    at failureErrorWithLog (node_modules/esbuild/lib/main.js:1472:15)",
          ].join("\n"),
        }
      : ok;
  const { checks, findings } = await health(VITE_APP, run).result;
  assert.deepEqual(checks.map((check) => `${check.check}:${check.status}`), ["typecheck:passed", "build:failed"]);
  const failed = findings.find((finding) => finding.rule === "build.failed")!;
  assert.equal(failed.severity, "critical");
  assert.deepEqual(failed.evidence, [{ file: "src/main.ts", line: 4 }]);
  assert.match(failed.detail, /exited with code 1\. x Build failed in 412ms/);
});

test("dependencies built for another platform make the build unavailable, not failed", async () => {
  const run: ProcessRunner = async (_command, args) =>
    args.includes("build") ? { ...ok, exitCode: 1, stderr: "Error: Cannot find module @rollup/rollup-darwin-arm64. npm has a bug..." } : ok;
  const { checks, findings } = await health(VITE_APP, run).result;
  const build = checks.find((check) => check.check === "build")!;
  assert.equal(build.status, "unavailable");
  assert.match(build.reason!, /different platform \(@rollup\/rollup-darwin-arm64 is missing\)/);
  assert.equal(findings.length, 0);
});

test("the project's package manager is used, with npm when it is not installed", async () => {
  const calls: string[] = [];
  const run: ProcessRunner = async (command, args) => {
    calls.push(`${command} ${args.join(" ")}`);
    return command === "pnpm" ? { ...ok, exitCode: null, notFound: true } : ok;
  };
  const files: Record<string, string> = { ...VITE_APP, "pnpm-lock.yaml": "lockfileVersion: 9\n" };
  delete files["package-lock.json"];
  const { checks } = await health(files, run).result;
  assert.deepEqual(calls.slice(-2), ["pnpm run build", "npm run build"]);
  assert.equal(checks.find((check) => check.check === "build")!.command, "npm run build");
});

test("nothing runs without installed dependencies or a build script", async () => {
  const calls: string[] = [];
  const run: ProcessRunner = async (command) => {
    calls.push(command);
    return ok;
  };
  const withoutInstall = { ...VITE_APP } as Record<string, string>;
  delete withoutInstall["node_modules/.bin/tsc"];
  const missing = await health(withoutInstall, run).result;
  assert.deepEqual(missing.checks.map((check) => `${check.check}:${check.status}:${check.reason}`), [
    "typecheck:unavailable:dependencies are not installed",
    "build:unavailable:dependencies are not installed",
  ]);
  assert.deepEqual(calls, []);

  const noBuild = await health({ "package.json": JSON.stringify({ name: "lib" }), "src/index.js": "" }, run).result;
  assert.deepEqual(noBuild.checks.map((check) => `${check.check}:${check.status}:${check.reason}`), [
    "typecheck:skipped:no TypeScript configuration",
    "build:skipped:no build script",
  ]);
});

test("project processes never receive Runtime's secrets", async () => {
  process.env.KORELUMINA_TEST_RUNTIME_SECRET = "runtime-only";
  try {
    const result = await runProjectProcess(
      process.execPath,
      ["-e", "process.stdout.write(JSON.stringify({ secret: process.env.KORELUMINA_TEST_RUNTIME_SECRET ?? null, ci: process.env.CI }))"],
      { cwd: tmpdir(), timeoutMs: 30_000 },
    );
    assert.deepEqual(JSON.parse(result.stdout), { secret: null, ci: "1" });
  } finally {
    delete process.env.KORELUMINA_TEST_RUNTIME_SECRET;
  }
});
