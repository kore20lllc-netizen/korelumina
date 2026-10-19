import {
  isNodeTestProcess,
  isolatedTestStorageRoot,
} from "../../knowledge-preservation/storage/resolveKnowledgeStorageRoot.js";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";

import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

import {
  CHIEF_AGENT_ACTIVATION_VERSION,
  type ChiefAgentActivationRecord,
} from "./ChiefAgentActivationRecord.js";

import type {
  ChiefAgentActivationRecordSource,
  ChiefAgentActivationRecordView,
} from "./ChiefAgentActivationGate.js";

/*
 * Activation records live in a TRACKED governance directory, not in the
 * gitignored runtime-data, so the owner commits them and they survive
 * machine loss (ADR-0041 Decision 2, F-9).
 */
export function defaultChiefAgentActivationRoot():
  string {
  const configured =
    process.env
      .KORELUMINA_ACTIVATION_ROOT;

  if (
    configured &&
    configured.trim()
  ) {
    return path.resolve(
      configured,
    );
  }

  /* F-25: tests never write the real activation records. */
  if (isNodeTestProcess()) {
    return isolatedTestStorageRoot("chief-agent-activation");
  }

  const repositoryRoot =
    path.resolve(
      path.dirname(
        fileURLToPath(
          import.meta.url,
        ),
      ),
      "../../../../..",
    );

  return path.join(
    repositoryRoot,
    "runtime/governance/chief-agent-activation",
  );
}

const FILE_PATTERN =
  /^(\d{6})-[a-z]+\.json$/;

export class FileChiefAgentActivationStore
  implements ChiefAgentActivationRecordSource {
  constructor(
    readonly root:
      string =
      defaultChiefAgentActivationRoot(),
  ) {}

  /*
   * Every record, oldest first. Any unreadable or inconsistent file throws:
   * the gate treats that as UNAVAILABLE and refuses (fail-closed).
   */
  list():
    ChiefAgentActivationRecord[] {
    if (
      !existsSync(
        this.root,
      )
    ) {
      return [];
    }

    const files =
      readdirSync(
        this.root,
      )
        .filter(
          (name) =>
            FILE_PATTERN.test(
              name,
            ),
        )
        .sort();

    return files.map(
      (name, index) => {
        const record =
          JSON.parse(
            readFileSync(
              path.join(
                this.root,
                name,
              ),
              "utf8",
            ),
          ) as ChiefAgentActivationRecord;

        if (
          record.version !==
            CHIEF_AGENT_ACTIVATION_VERSION ||
          record.sequence !==
            index + 1 ||
          Number(
            name.slice(
              0,
              6,
            ),
          ) !==
            record.sequence
        ) {
          throw new Error(
            "chief_agent_activation_record_sequence_invalid",
          );
        }

        return record;
      },
    );
  }

  latestRecord():
    ChiefAgentActivationRecord | null {
    return this.list().at(
      -1,
    ) ?? null;
  }

  latest():
    ChiefAgentActivationRecordView | null {
    const record =
      this.latestRecord();

    return record
      ? {
          activationId:
            record.activationId,

          state:
            record.state,

          autonomyLevel:
            record.autonomyLevel,
        }
      : null;
  }

  append(
    record:
      ChiefAgentActivationRecord,
  ): void {
    const expected =
      this.list().length + 1;

    if (
      record.sequence !==
      expected
    ) {
      throw new Error(
        "chief_agent_activation_record_sequence_conflict",
      );
    }

    mkdirSync(
      this.root,
      {
        recursive:
          true,
      },
    );

    const file =
      path.join(
        this.root,
        `${String(
          record.sequence,
        ).padStart(
          6,
          "0",
        )}-${record.action.toLowerCase()}.json`,
      );

    if (
      existsSync(
        file,
      )
    ) {
      throw new Error(
        "chief_agent_activation_record_exists",
      );
    }

    const temporary =
      `${file}.tmp-${process.pid}`;

    try {
      writeFileSync(
        temporary,
        `${JSON.stringify(
          record,
          null,
          2,
        )}\n`,
        "utf8",
      );

      renameSync(
        temporary,
        file,
      );
    } finally {
      rmSync(
        temporary,
        {
          force:
            true,
        },
      );
    }
  }
}
