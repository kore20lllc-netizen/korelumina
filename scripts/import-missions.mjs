import fs from "node:fs";

/*
 * MS-6 (ADR-0044 Decision 7): import open tickets as missions, once.
 *
 *   node scripts/import-missions.mjs runtime/executive/mission-imports/<file>.json
 *
 * Each ticket becomes a mission created by the owner with its plan, so it
 * lands Planned: importing decides nothing. The owner submits and approves
 * the ones to pursue in the Executive Office. The script is idempotent: a
 * ticket whose mission already exists (by its source ticket) is skipped.
 * Runtime must be running on this machine.
 */

const RUNTIME = process.env.KORELUMINA_RUNTIME_URL ?? "http://127.0.0.1:4100";
const OWNER = "human:founder";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-missions.mjs <import file>");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
if (manifest.version !== "mission-import:v1" || !Array.isArray(manifest.missions)) {
  console.error(`${file} is not a mission-import:v1 file`);
  process.exit(1);
}

const marker = (ticket) => `Imported by ${manifest.ticket} from ${file}. Source ticket: ${ticket}.`;

async function call(path, body) {
  const response = await fetch(`${RUNTIME}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const answer = await response.json().catch(() => null);
  if (!response.ok || answer?.ok === false) {
    throw new Error(answer?.error ?? `Runtime answered ${response.status}`);
  }
  return answer;
}

const existing = (await call("/api/executive/missions")).missions;
let created = 0;

for (const ticket of manifest.missions) {
  const description = marker(ticket.sourceTicket);
  const found = existing.find((mission) => mission.description === description);
  if (found) {
    console.log(`skip    ${ticket.sourceTicket}: already ${found.id} (${found.state})`);
    continue;
  }
  const { mission } = await call("/api/executive/missions", {
    actorId: OWNER,
    title: ticket.title,
    objective: ticket.objective,
    description,
    type: ticket.type,
    priority: ticket.priority,
    risks: ticket.risks,
    relatedRepositories: ticket.relatedRepositories,
    plan: ticket.plan,
  });
  created += 1;
  console.log(`created ${ticket.sourceTicket}: ${mission.id} ${mission.state} · ${mission.title}`);
}

console.log(`${created} created, ${manifest.missions.length - created} already imported.`);
