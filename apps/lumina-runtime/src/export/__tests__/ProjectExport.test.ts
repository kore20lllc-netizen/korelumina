import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { extractArchive } from "../../import/ArchiveExtract.js";
import { selectExportFiles, writeProjectZip } from "../ProjectExport.js";
import { crc32 } from "../ZipWriter.js";

/* MS-2026-0017: the download carries the customer's project and never its secrets. */

function project(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "export-"));
  const files: Record<string, string> = {
    "package.json": '{"name":"shop"}',
    "src/App.tsx": "export default function App() { return <h1>Café ☕</h1>; }\n",
    "src/big.txt": "repeat ".repeat(5000),
    ".env": "VITE_SUPABASE_ANON_KEY=live-secret",
    ".env.local": "SECRET=1",
    "apps/web/.env.production": "SECRET=2",
    ".env.example": "VITE_SUPABASE_URL=",
    ".gitignore": "node_modules\n",
    "node_modules/react/index.js": "module.exports = {}",
    "dist/index.html": "<html></html>",
    ".git/config": "[core]",
    "supabase/migrations/001_init.sql": "create table t (id int);",
  };
  for (const [file, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  }
  fs.symlinkSync("/etc/passwd", path.join(root, "src/link"));
  return root;
}

test("crc32 matches the standard check value", () => {
  assert.equal(crc32(Buffer.from("123456789")), 0xcbf43926);
});

test("the selection keeps the project and leaves out secrets, dependencies, builds, git and links", () => {
  const selection = selectExportFiles(project());
  assert.deepEqual(selection.files.map((file) => file.path), [
    ".env.example",
    ".gitignore",
    "package.json",
    "src/App.tsx",
    "src/big.txt",
    "supabase/migrations/001_init.sql",
  ]);
  assert.deepEqual(selection.leftOutSecrets.sort(), [".env", ".env.local", "apps/web/.env.production"]);
  assert.deepEqual(selection.leftOutLinks, ["src/link"]);
});

test("the zip opens with an independent reader and holds exactly the selection", () => {
  const root = project();
  const chunks: Buffer[] = [];
  writeProjectZip(root, "shop", selectExportFiles(root), (chunk) => chunks.push(chunk));
  const zip = Buffer.concat(chunks);
  assert.ok(!zip.includes(Buffer.from("live-secret")), "no secret anywhere in the zip");

  const out = fs.mkdtempSync(path.join(os.tmpdir(), "export-out-"));
  const result = extractArchive("zip", zip, out);
  assert.equal(result.files, 6);
  assert.equal(fs.readFileSync(path.join(out, "src/App.tsx"), "utf8"), "export default function App() { return <h1>Café ☕</h1>; }\n");
  assert.equal(fs.readFileSync(path.join(out, "src/big.txt"), "utf8"), "repeat ".repeat(5000));
  assert.equal(fs.existsSync(path.join(out, ".env")), false);
});

test("the zip passes the system unzip integrity test", (t) => {
  try {
    execFileSync("unzip", ["-v"], { stdio: "ignore" });
  } catch {
    t.skip("unzip is not installed here");
    return;
  }
  const root = project();
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "export-zip-")), "shop.zip");
  const chunks: Buffer[] = [];
  writeProjectZip(root, "shop", selectExportFiles(root), (chunk) => chunks.push(chunk));
  fs.writeFileSync(file, Buffer.concat(chunks));
  const listing = execFileSync("unzip", ["-t", file], { encoding: "utf8" });
  assert.match(listing, /No errors detected/);
  assert.match(execFileSync("unzip", ["-l", file], { encoding: "utf8" }), /shop\/src\/App\.tsx/);
});
