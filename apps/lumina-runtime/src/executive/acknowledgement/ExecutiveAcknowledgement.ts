import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { resolveExecutiveStoragePath } from "../storage/resolveExecutiveStorageRoot.js";

/*
 * MS-2026-0004 (E2.T2): Critical notifications always require the owner's
 * acknowledgement (Chief Agent Interface). An acknowledgement records that
 * the owner saw one specific condition, who and when. It does not clear the
 * condition: the notification stays listed, shown as acknowledged, and a
 * new condition (another failed cycle, another state) needs its own.
 * Committed with the other executive records.
 */

export interface ExecutiveAcknowledgement {
  id: string;
  /* A stable key for the condition, e.g. "learning-cycle-failed:learning-cycle:ab12". */
  conditionKey: string;
  title: string;
  note?: string;
  acknowledgedBy: string;
  acknowledgedAt: number;
}

export class AcknowledgementError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "AcknowledgementError";
  }
}

const KEY = /^[a-z0-9][a-z0-9:._-]{2,199}$/i;

function root(): string {
  return resolveExecutiveStoragePath("acknowledgements");
}

export function acknowledgementId(conditionKey: string): string {
  return `ACK-${crypto.createHash("sha256").update(conditionKey).digest("hex").slice(0, 16)}`;
}

export class ExecutiveAcknowledgementService {
  constructor(private readonly now: () => number = () => Date.now()) {}

  list(): ExecutiveAcknowledgement[] {
    const directory = root();
    if (!fs.existsSync(directory)) return [];
    return fs
      .readdirSync(directory)
      .filter((name) => name.endsWith(".json"))
      .map((name) => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8")) as ExecutiveAcknowledgement)
      .sort((left, right) => right.acknowledgedAt - left.acknowledgedAt);
  }

  /* Acknowledging the same condition again returns the first record unchanged. */
  acknowledge(input: { conditionKey?: unknown; title?: unknown; note?: unknown }, actorId: string): ExecutiveAcknowledgement {
    const actor = actorId.trim();
    if (!actor.startsWith("human:")) throw new AcknowledgementError("acknowledgement_human_actor_required");
    const conditionKey = typeof input.conditionKey === "string" ? input.conditionKey.trim() : "";
    if (!KEY.test(conditionKey)) throw new AcknowledgementError("acknowledgement_condition_key_invalid");
    const title = typeof input.title === "string" ? input.title.trim().slice(0, 500) : "";
    if (!title) throw new AcknowledgementError("acknowledgement_title_required");

    const id = acknowledgementId(conditionKey);
    const file = path.join(root(), `${id}.json`);
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));

    const note = typeof input.note === "string" && input.note.trim() ? input.note.trim().slice(0, 2_000) : undefined;
    const record: ExecutiveAcknowledgement = {
      id,
      conditionKey,
      title,
      ...(note ? { note } : {}),
      acknowledgedBy: actor,
      acknowledgedAt: this.now(),
    };
    fs.mkdirSync(root(), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    return record;
  }
}
