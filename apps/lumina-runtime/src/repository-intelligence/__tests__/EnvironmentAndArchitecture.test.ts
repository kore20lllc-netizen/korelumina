import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  analyzeEnvironment,
  dotenvNames,
  mapArchitecture,
  takeRepositoryInventory,
  takeRepositorySnapshot,
} from "../index.js";

/* MS-2026-0012: environment analysis and architecture map. */

function repository(files: Record<string, string>): string {
  const root = mkdtempSync(path.join(tmpdir(), "korelumina-environment-architecture-"));
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }
  return root;
}

function analyze(files: Record<string, string>) {
  const snapshot = takeRepositorySnapshot(repository(files));
  const inventory = takeRepositoryInventory(snapshot);
  return { environment: analyzeEnvironment(snapshot, inventory), architecture: mapArchitecture(snapshot, inventory) };
}

test("dotenv names are read without values", () => {
  assert.deepEqual(dotenvNames("# comment\nA=1\nexport B = two\n  C=\nnot a line\nD"), ["A", "B", "C"]);
});

test("variables read in code are compared with the example file, by name only", () => {
  const { environment } = analyze({
    "package.json": JSON.stringify({ name: "app" }),
    ".gitignore": ".env\n",
    ".env": "LOCAL_ONLY=secret-value\n",
    ".env.example": "API_URL=\nLEFTOVER=\n",
    "src/config.ts": [
      "export const api = import.meta.env.VITE_API_URL;",
      "export const url = process.env.API_URL;",
      "export const key = process.env",
      "  .PAYMENT_KEY;",
      'export const other = process.env["OTHER_TOKEN"];',
      "export const mode = process.env.NODE_ENV;",
      "export const leak = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;",
    ].join("\n"),
    "src/config.test.ts": "process.env.TEST_ONLY_FLAG;\n",
    "supabase/functions/send/index.ts": 'Deno.env.get("RESEND_API_KEY"); Deno.env.get("SUPABASE_URL");\n',
  });
  assert.deepEqual(
    environment.variables.map((use) => `${use.name}:${use.documented ? "documented" : "undocumented"}${use.public ? ":public" : ""}`),
    [
      "API_URL:documented",
      "OTHER_TOKEN:undocumented",
      "PAYMENT_KEY:undocumented",
      "RESEND_API_KEY:undocumented",
      "TEST_ONLY_FLAG:undocumented",
      "VITE_API_URL:undocumented:public",
      "VITE_SUPABASE_SERVICE_ROLE_KEY:undocumented:public",
    ],
  );
  const rules = environment.findings.map((finding) => `${finding.rule} ${finding.title.split(" ")[0]}`).sort();
  assert.deepEqual(rules, [
    "environment.secret-in-browser VITE_SUPABASE_SERVICE_ROLE_KEY",
    "environment.undocumented OTHER_TOKEN",
    "environment.undocumented PAYMENT_KEY",
    "environment.undocumented RESEND_API_KEY",
    "environment.undocumented VITE_API_URL",
    "environment.undocumented VITE_SUPABASE_SERVICE_ROLE_KEY",
    "environment.unused LEFTOVER",
  ]);
  const payment = environment.variables.find((use) => use.name === "PAYMENT_KEY")!;
  assert.deepEqual(payment.reads, [{ file: "src/config.ts", line: 3 }]);
  assert.equal(JSON.stringify(environment).includes("secret-value"), false);
});

test("without an example file, one finding lists what the code needs", () => {
  const { environment } = analyze({
    "package.json": JSON.stringify({ name: "app" }),
    "src/a.ts": "process.env.ONE; process.env.TWO;\n",
  });
  assert.deepEqual(environment.findings.map((finding) => finding.rule), ["environment.no-example-file"]);
  assert.match(environment.findings[0]!.title, /^2 environment variables are read/);
});

const APP = {
  "package.json": JSON.stringify({ name: "web", private: true, workspaces: ["packages/*"], scripts: { seed: "node scripts/seed.mjs" } }),
  "tsconfig.json": '{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } } }',
  "vite.config.ts": 'import path from "path";\nexport default { resolve: { alias: { "~lib": path.resolve(__dirname, "./lib") } } };\n',
  "index.html": '<script type="module" src="/src/main.tsx"></script>',
  "src/main.tsx": 'import { App } from "@/App";\nimport "./styles.css";\nimport { ui } from "@acme/ui";\nimport { helper } from "~lib/helper";\nconst lazy = () => import("./pages/Lazy");\n',
  "src/App.tsx": 'import { a } from "./cycle/a.js";\nimport { gone } from "./missing";\nimport parent from "../src/";\nexport const App = 1;\n',
  "src/index.ts": "export default 1;\n",
  "src/cycle/a.ts": 'import { b } from "./b";\nexport const a = 1;\n',
  "src/cycle/b.ts": 'import { a } from "./a";\nexport const b = 2;\n',
  "src/types/x.ts": 'import type { Y } from "./y";\nexport type X = 1;\n',
  "src/types/y.ts": 'import type { X } from "./x";\nexport type Y = 2;\n',
  "src/pages/Lazy.tsx": "export default 1;\n",
  "src/styles.css": "body {}\n",
  "src/orphan.ts": "export const unused = 1;\n",
  "src/orphan.test.ts": 'import { unused } from "./orphan";\n',
  "lib/helper.ts": "export const helper = 1;\n",
  "scripts/seed.mjs": "console.log(1);\n",
  "packages/ui/package.json": JSON.stringify({ name: "@acme/ui", main: "dist/index.js" }),
  "packages/ui/src/index.ts": "export const ui = 1;\n",
  "packages/ui/src/unused.ts": "export const nothing = 1;\n",
  "archive/old.ts": 'import { x } from "./nowhere";\n',
};

test("imports resolve through relative paths, .js to .ts, index files, aliases and workspace packages", () => {
  const { architecture } = analyze(APP);
  const edges = architecture.edges.map((edge) => `${edge.from} -> ${edge.to}${edge.runtime ? "" : " (lazy or type)"}`).sort();
  assert.deepEqual(
    edges.filter((edge) => edge.startsWith("src/main.tsx") || edge.startsWith("src/App.tsx")),
    [
      "src/App.tsx -> src/cycle/a.ts",
      "src/App.tsx -> src/index.ts",
      "src/main.tsx -> lib/helper.ts",
      "src/main.tsx -> packages/ui/src/index.ts",
      "src/main.tsx -> src/App.tsx",
      "src/main.tsx -> src/pages/Lazy.tsx (lazy or type)",
      "src/main.tsx -> src/styles.css",
    ],
  );
  assert.deepEqual(architecture.packageGraph, { ".": ["packages/ui"] });
  assert.ok(architecture.entryPoints.includes("src/main.tsx"));
  assert.ok(architecture.entryPoints.includes("scripts/seed.mjs"));
});

test("broken imports, cycles and unreachable files are reported", () => {
  const { architecture } = analyze(APP);
  const broken = architecture.findings.filter((finding) => finding.rule === "architecture.broken-import");
  assert.deepEqual(broken.map((finding) => `${finding.severity} ${finding.evidence[0]!.file}:${finding.evidence[0]!.line}`), ["high src/App.tsx:2"]);
  /* Archived copies are summarized per archived folder. */
  const archived = architecture.findings.filter((finding) => finding.rule === "architecture.broken-imports-archived");
  assert.deepEqual(archived.map((finding) => `${finding.severity} ${finding.title}`), ["info 1 broken import in archived code under archive"]);
  assert.deepEqual(architecture.cycles, [["src/cycle/a.ts", "src/cycle/b.ts"]]);
  assert.deepEqual(architecture.unreachable, ["archive/old.ts", "packages/ui/src/unused.ts", "src/types/x.ts", "src/types/y.ts"]);
  const unreachable = architecture.findings.filter((finding) => finding.rule === "architecture.unreachable-files");
  assert.deepEqual(unreachable.map((finding) => finding.title), [
    "2 files in the project are never loaded",
    "1 file in packages/ui is never loaded",
  ]);
});
