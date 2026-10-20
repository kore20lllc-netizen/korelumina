import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/*
 * MS-2026-0007: governed records live in git, not only on one machine.
 *
 * The Chief Agent's activation rests on certifications that Runtime
 * re-derives from records in runtime-data. Those records are tracked in
 * place (.gitignore exceptions) so a fresh clone re-derives exactly what
 * the owner's machine does. This check fails the build if any of them
 * would be ignored by git, or is missing, so none can silently drop out of
 * git: in particular a newly designated Day-0 replay, whose two folders
 * must be added to the .gitignore exceptions.
 */

const ROOT = process.cwd();
const DATA = "runtime-data";

const GOVERNED = [
  "knowledge-education/authority-resolutions",
  "knowledge-education/chief-agent-production-workspace-authorization",
  "knowledge-education/educational-corpus",
  "knowledge-education/educational-corpus-certification",
  "knowledge-education/initial-competency-certification",
  "knowledge-education/initial-competency-evidence",
  "knowledge-education/initial-competency-human-acceptance",
  "genesis/runtime-replay-designation.json",
  "genesis/day-zero-certification",
  "genesis/day-zero-conversation-coverage-certification",
  "genesis/conversation-acquisition",
  "genesis/conversation-authoritative-completeness-certification",
  "genesis/conversation-expected-history",
  "genesis/conversation-expected-history-amendments",
  "genesis/conversation-expected-history-candidate",
  "genesis/conversation-expected-history-candidate-review",
];

function filesUnder(relative) {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) return null;
  if (fs.statSync(absolute).isFile()) return [relative];
  const files = [];
  for (const entry of fs.readdirSync(absolute, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) {
      files.push(path.relative(ROOT, path.join(entry.parentPath ?? entry.path, entry.name)));
    }
  }
  return files;
}

function ignored(files) {
  if (files.length === 0) return [];
  try {
    const out = execFileSync("git", ["check-ignore", "--stdin"], { cwd: ROOT, input: files.join("\n"), encoding: "utf8" });
    return out.split("\n").filter(Boolean);
  } catch (error) {
    if (error.status === 1) return [];
    throw error;
  }
}

const required = GOVERNED.map((entry) => path.join(DATA, entry));

const designationFile = path.join(ROOT, DATA, "genesis/runtime-replay-designation.json");
if (fs.existsSync(designationFile)) {
  const { replayId } = JSON.parse(fs.readFileSync(designationFile, "utf8"));
  const folder = crypto.createHash("sha256").update(replayId).digest("hex");
  required.push(path.join(DATA, "genesis/replays", folder), path.join(DATA, "genesis/historical-correlation", folder));
}

const problems = [];
let checked = 0;
for (const entry of required) {
  const files = filesUnder(entry);
  if (!files || files.length === 0) {
    problems.push(`missing: ${entry}`);
    continue;
  }
  checked += files.length;
  for (const file of ignored(files)) problems.push(`ignored by git: ${file}`);
}

if (problems.length) {
  console.error("FAIL: governed records would not reach git (MS-2026-0007).");
  for (const problem of problems.slice(0, 20)) console.error(`- ${problem}`);
  if (problems.length > 20) console.error(`- … ${problems.length - 20} more`);
  console.error("\nAdd an exception to .gitignore for each, then commit the records.");
  process.exit(1);
}

console.log(`PASS: ${required.length} governed records (${checked} files) are tracked by git.`);
