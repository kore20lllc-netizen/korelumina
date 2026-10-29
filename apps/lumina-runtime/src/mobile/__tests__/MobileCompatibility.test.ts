import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { takeRepositorySnapshot } from "../../repository-intelligence/RepositorySnapshot.js";
import type { RepositorySnapshot } from "../../repository-intelligence/RepositorySnapshot.js";
import { MobileCompatibilityInputError } from "../MobileCompatibility.js";
import { analyzeMobileCompatibility } from "../analyzeMobileCompatibility.js";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const order = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
function snapshot(contents: Record<string, string>, ignored: string[] = []): RepositorySnapshot {
  const files = Object.keys(contents).sort(order).map(file => ({ path: file, bytes: Buffer.byteLength(contents[file]), sha256: sha(contents[file]), text: true, ignored: ignored.includes(file), tracked: null }));
  return { root: "/isolated-fixture", files, fingerprint: sha(files.filter(file => !file.ignored).map(file => `${file.path}\0${file.sha256}`).join("\n")),
    commit: null, skippedDirectories: ["dist"], read: file => contents[file] ?? null,
    readSensitive: () => { throw new Error("Sensitive reads are forbidden"); } };
}
const manifest = (dependencies: Record<string, string> = { react: "18", vite: "5" }, extra = {}) => JSON.stringify({ dependencies, scripts: { build: "vite build" }, ...extra });
const web = (dependencies?: Record<string, string>) => ({ "package.json": manifest(dependencies), "index.html": "<html><head></head><body></body></html>", "src/main.tsx": "export const app = 'fixture';" });
const app = (contents: Record<string, string>) => analyzeMobileCompatibility(snapshot(contents)).applications[0];
const rejects = (input: RepositorySnapshot, code: string) => assert.throws(() => analyzeMobileCompatibility(input), error => error instanceof MobileCompatibilityInputError && error.code === code);

test("valid web analysis is deterministic, hash-bound and explicitly not build certification", () => {
  const input = snapshot(web()); const result = analyzeMobileCompatibility(input);
  assert.deepEqual(result, analyzeMobileCompatibility(input));
  assert.deepEqual(result, analyzeMobileCompatibility(snapshot(Object.fromEntries(Object.entries(web()).reverse()))));
  assert.equal(result.applications[0].classification, "candidate");
  assert.equal(result.applications[0].framework, "react");
  assert.equal(result.selectedApplicationRoot, ".");
  assert.equal(result.buildVerification, "not-performed");
  assert.match(result.reportFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(result.applications[0].targets.length, 2);
  assert.ok(result.applications[0].evidence.some(e => e.code === "dependency:react"));
});

for (const [dependency, framework] of [["vue", "vue"], ["svelte", "svelte"], ["vite", "vite"]]) {
  test(`recognizes ${framework} with application entry evidence`, () => {
    const result = app(web({ [dependency]: "1", vite: "5" }));
    assert.equal(result.framework, framework); assert.equal(result.classification, "candidate");
  });
}
test("recognizes a single Angular application and refuses ambiguous Angular workspace targets", () => {
  const files = { "package.json": manifest({ "@angular/core": "20" }), "src/index.html": "<head></head>", "src/main.ts": "bootstrapApplication();", "angular.json": JSON.stringify({ projects: { app: { projectType: "application" } } }) };
  assert.equal(app(files).classification, "candidate");
  files["angular.json"] = JSON.stringify({ projects: { a: { projectType: "application" }, b: { projectType: "application" } } });
  assert.equal(app(files).classification, "unknown");
  assert.ok(app(files).blockers.some(item => item.code === "ambiguous-angular-target"));
});
for (const [dependency, framework] of [["next", "next"], ["nuxt", "nuxt"], ["@sveltejs/kit", "sveltekit"]]) {
  test(`${framework} requires static/server separation even with an export-looking config`, () => {
    const result = app({ ...web({ [dependency]: "1" }), "next.config.js": "export default { output: 'export' };" });
    assert.equal(result.framework, framework); assert.equal(result.classification, "requires-adaptation");
    assert.ok(result.blockers.some(b => b.code === "static-export-unverified"));
  });
}
test("multiple package applications remain separate and selection is mandatory", () => {
  const input = snapshot({ "package.json": manifest({ vite: "5" }, { workspaces: ["apps/*", "packages/*"] }),
    "apps/web/package.json": manifest(), "apps/web/index.html": "<head></head>", "apps/web/src/main.tsx": "render();",
    "apps/api/package.json": manifest({ express: "4" }), "apps/api/server/index.ts": "listen();",
  });
  const result = analyzeMobileCompatibility(input);
  assert.equal(result.monorepo, true); assert.equal(result.selection, "ambiguous"); assert.equal(result.selectedApplicationRoot, null);
  assert.deepEqual(result.applications.map(a => [a.root, a.classification]), [["apps/api", "unsupported"], ["apps/web", "candidate"]]);
  assert.equal(analyzeMobileCompatibility(input, { applicationRoot: "apps/web" }).selectedApplicationRoot, "apps/web");
  const missing = analyzeMobileCompatibility(input, { applicationRoot: "apps/missing" });
  assert.equal(missing.selectedApplicationRoot, null); assert.ok(missing.blockers.some(b => b.code === "application-root-not-found"));
});
test("pnpm workspaces are recognized and child server evidence does not contaminate its sibling", () => {
  const result = analyzeMobileCompatibility(snapshot({ "pnpm-workspace.yaml": "packages:\n - apps/*\n", "apps/a/package.json": manifest(), "apps/a/index.html": "<head></head>", "apps/a/src/main.ts": "main();", "apps/b/package.json": manifest({ fastify: "5" }), "apps/b/server/index.ts": "listen();" }));
  assert.equal(result.monorepo, true); assert.equal(result.applications[0].classification, "candidate");
  assert.deepEqual(result.applications[0].backendDependencies, []);
});
test("workspace-only containers are not fabricated applications", () => {
  const result = analyzeMobileCompatibility(snapshot({ "package.json": JSON.stringify({ workspaces: ["apps/*"] }) }));
  assert.equal(result.selection, "none"); assert.deepEqual(result.applications, []);
});
test("existing native projects are preserved, not treated as fresh Capacitor candidates", () => {
  const result = app({ ...web(), "android/app/src/main/AndroidManifest.xml": "<manifest/>", "android/app/build.gradle": "plugins {}", "ios/App.xcodeproj/project.pbxproj": "project" });
  assert.equal(result.framework, "native"); assert.equal(result.adapter, "existing-native");
  assert.deepEqual(result.nativeTargets, ["android", "ios"]); assert.equal(result.classification, "requires-adaptation");
});
test("standalone Android and iOS evidence is recognized without package.json", () => {
  const android = app({ "app/src/main/AndroidManifest.xml": "<manifest/>", "build.gradle.kts": "plugins {}" });
  assert.equal(android.adapter, "existing-native"); assert.equal(android.targets.find(t => t.target === "ios")?.classification, "unsupported");
  const ios = app({ "App.xcodeproj/project.pbxproj": "project" });
  assert.equal(ios.framework, "native"); assert.deepEqual(ios.nativeTargets, ["ios"]);
});
for (const dependency of ["expo", "react-native"]) {
  test(`${dependency} requires a dedicated native adapter`, () => {
    const result = app({ "package.json": manifest({ [dependency]: "1" }) });
    assert.equal(result.framework, dependency); assert.equal(result.adapter, dependency);
    assert.equal(result.classification, "requires-adaptation");
  });
}
test("backend-only and unknown repositories fail closed", () => {
  assert.equal(app({ "package.json": manifest({ express: "4" }) }).classification, "unsupported");
  assert.equal(app({ "requirements.txt": "fastapi" }).framework, "backend");
  assert.equal(app({ "README.md": "project" }).classification, "unknown");
  assert.equal(app({ "package.json": JSON.stringify({ dependencies: { react: "18" } }) }).classification, "unknown");
});
test("static HTML requires a reviewed build adapter rather than claiming packaging readiness", () => {
  assert.equal(app({ "index.html": "<head></head>" }).classification, "requires-adaptation");
});
test("backend dependencies and co-located server code block a simple web wrapper", () => {
  const result = app({ ...web({ vite: "5", react: "18", pg: "8", express: "4" }), "src/server/api.ts": "listen();" });
  assert.equal(result.classification, "requires-adaptation");
  assert.deepEqual(result.backendDependencies, ["express", "pg"]);
  for (const code of ["co-located-server", "server-dependency", "server-source"]) assert.ok(result.blockers.some(b => b.code === code));
});
test("client SDKs are disclosed without treating them as backend execution", () => {
  const result = app(web({ vite: "5", react: "18", "@supabase/supabase-js": "2" }));
  assert.equal(result.classification, "candidate"); assert.deepEqual(result.backendDependencies, ["@supabase/supabase-js"]);
  assert.ok(result.recommendations.some(value => value.includes("backend connectivity")));
});
test("incomplete entries, missing build scripts and conflicting UI frameworks never become candidates", () => {
  assert.notEqual(app({ "package.json": manifest(), "src/main.tsx": "main();" }).classification, "candidate");
  assert.notEqual(app({ ...web(), "package.json": manifest(undefined, { scripts: {} }) }).classification, "candidate");
  assert.equal(app(web({ react: "18", vue: "3", vite: "5" })).classification, "unknown");
  assert.notEqual(app({ ...web(), "index.html": "<body></body>" }).classification, "candidate");
});
for (const value of ["{bad-json", "[]", "null", '{"dependencies":[]}', '{"scripts":{"build":2}}', '{"workspaces":123}']) {
  test(`malformed manifest is blocked without echoing its content (${value.slice(0, 15)})`, () => {
    const result = app({ ...web(), "package.json": value });
    assert.equal(result.classification, "unknown"); assert.ok(result.blockers.some(b => b.code === "malformed-manifest"));
  });
}
test("project JavaScript, configuration, environment files and sensitive readers are never executed or read", () => {
  const files = { ...web(), "vite.config.ts": "throw new Error('must not execute');", ".env": "PRIVATE_SECRET=never-report-this", ".env.example": "KEY=also-not-report-this" };
  const input = snapshot(files); const reads: string[] = []; const original = input.read;
  input.read = file => { reads.push(file); assert.ok(!file.includes(".env") && !file.endsWith("config.ts")); return original(file); };
  const output = JSON.stringify(analyzeMobileCompatibility(input));
  assert.deepEqual(reads.sort(), ["index.html", "package.json"]);
  assert.ok(!output.includes("never-report-this") && !output.includes("also-not-report-this"));
});
test("ignored local manifests cannot affect classification", () => {
  const input = snapshot({ ...web(), "local/package.json": "bad JSON" }, ["local/package.json"]);
  assert.equal(analyzeMobileCompatibility(input).applications.length, 1);
  assert.equal(analyzeMobileCompatibility(input).applications[0].classification, "candidate");
});
for (const unsafe of ["../package.json", "/package.json", "C:/package.json", "a\\package.json", "a//package.json", "./package.json", "a/../package.json", "a/%2e%2e/package.json", "a\0/package.json"]) {
  test(`rejects unsafe snapshot path ${JSON.stringify(unsafe)}`, () => rejects(snapshot({ [unsafe]: "{}" }), "unsafe_path"));
}
test("rejects unsafe explicit application roots", () => {
  for (const root of ["../app", "/app", "a/..", "a\\b"]) assert.throws(() => analyzeMobileCompatibility(snapshot(web()), { applicationRoot: root }), MobileCompatibilityInputError);
});
test("rejects duplicate paths, case aliases and file/directory collisions", () => {
  const input = snapshot(web()); input.files = [...input.files, input.files[0]]; rejects(input, "duplicate_path");
  rejects(snapshot({ "App/package.json": "{}", "app/package.json": "{}" }), "duplicate_path");
  rejects(snapshot({ app: "file", "app/package.json": "{}" }), "duplicate_path");
  rejects(snapshot({ APP: "file", "app/package.json": "{}" }), "duplicate_path");
});
test("rejects malformed snapshot metadata and fingerprints", () => {
  rejects({ ...snapshot(web()), fingerprint: "fake" }, "invalid_snapshot");
  rejects({ ...snapshot(web()), fingerprint: "0".repeat(64) }, "evidence_mismatch");
  const input = snapshot(web()); input.files[0].bytes = -1; rejects(input, "invalid_snapshot");
  assert.throws(() => analyzeMobileCompatibility(null as unknown as RepositorySnapshot), MobileCompatibilityInputError);
});
test("rejects changed or unreadable manifest evidence", () => {
  const mismatch = snapshot(web()); mismatch.read = () => "{}"; rejects(mismatch, "evidence_mismatch");
  const unreadable = snapshot(web()); unreadable.read = () => null; rejects(unreadable, "unreadable_evidence");
  const thrown = snapshot(web()); thrown.read = () => { throw new Error("secret read error"); }; rejects(thrown, "unreadable_evidence");
});


test("case-aliased directories and files inside skipped directories are rejected", () => {
  rejects(snapshot({ "App/a.txt": "a", "app/b.txt": "b" }), "duplicate_path");
  rejects(snapshot({ "dist/package.json": "{}" }), "invalid_snapshot");
});
test("existing Capacitor configuration requires review without evaluating it", () => {
  const input = snapshot({ ...web(), "capacitor.config.ts": "throw new Error('not executed');" });
  const result = analyzeMobileCompatibility(input).applications[0];
  assert.equal(result.classification, "requires-adaptation");
  assert.ok(result.blockers.some(b => b.code === "existing-capacitor-config"));
});
test("unsupported server-capable framework combinations are never simple candidates", () => {
  for (const dependency of ["@remix-run/react", "astro", "@tanstack/react-start"]) {
    assert.equal(app(web({ react: "18", vite: "5", [dependency]: "1" })).classification, "requires-adaptation");
  }
});
test("Angular JSON integrity failures are input errors, not swallowed config warnings", () => {
  const input = snapshot({ "package.json": manifest({ "@angular/core": "20" }), "angular.json": "{}", "src/main.ts": "main();", "src/index.html": "<head></head>" });
  const read = input.read; input.read = file => file === "angular.json" ? "{changed}" : read(file);
  rejects(input, "evidence_mismatch");
});
test("analysis is bounded for excessive application roots and manifests", () => {
  rejects(snapshot(Object.fromEntries(Array.from({ length: 257 }, (_, i) => [`apps/a${i}/package.json`, "{}"]))), "invalid_snapshot");
  rejects(snapshot(Object.fromEntries(Array.from({ length: 257 }, (_, i) => [`apps/a${i}/index.html`, "<head></head>"]))), "invalid_snapshot");
});
test("unreadable oversized or non-text evidence is refused", () => {
  const input = snapshot(web()); input.files.find(f => f.path === "package.json")!.text = false;
  rejects(input, "unreadable_evidence");
  const large = snapshot({ "package.json": " ".repeat(1_000_001) }); rejects(large, "unreadable_evidence");
});


test("accepts the actual Runtime snapshot and never follows excluded symlinks", () => {
  const temporary = mkdtempSync(path.join(tmpdir(), "klm-mobile-snapshot-"));
  try {
    const root = path.join(temporary, "project"); mkdirSync(root, { recursive: true });
    for (const [file, text] of Object.entries(web())) {
      mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      writeFileSync(path.join(root, file), text);
    }
    writeFileSync(path.join(temporary, "outside.json"), "private fixture");
    symlinkSync(path.join(temporary, "outside.json"), path.join(root, "linked-package.json"));
    const input = takeRepositorySnapshot(root);
    input.readSensitive = () => { throw new Error("Sensitive reads forbidden"); };
    assert.ok(!input.files.some(file => file.path === "linked-package.json"));
    const result = analyzeMobileCompatibility(input);
    assert.equal(result.applications[0].classification, "candidate");
    assert.equal(result.snapshotFingerprint, input.fingerprint);
  } finally { rmSync(temporary, { recursive: true, force: true }); }
});
