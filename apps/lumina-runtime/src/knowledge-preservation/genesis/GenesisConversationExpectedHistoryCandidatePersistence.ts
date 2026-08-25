import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import path from "node:path";

import {
  getRuntimeDataRoot,
} from "../../projects/workspacePaths.js";

import type {
  GenesisConversationExpectedHistoryCandidate,
} from "./GenesisConversationExpectedHistoryCandidate.js";


export interface GenesisConversationExpectedHistoryCandidatePersistenceOptions {
  storageRoot?:
    string;
}


function atomicWriteJson(
  file:
    string,

  value:
    unknown,
): void {
  mkdirSync(
    path.dirname(
      file,
    ),
    {
      recursive:
        true,
    },
  );

  const temporary =
    `${file}.tmp-${process.pid}`;

  try {
    writeFileSync(
      temporary,
      `${JSON.stringify(
        value,
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


export class FileGenesisConversationExpectedHistoryCandidatePersistenceStore {
  readonly storageRoot:
    string;

  constructor(
    options:
      GenesisConversationExpectedHistoryCandidatePersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
          "conversation-expected-history-candidate",
        ),
      );
  }


  private currentFile():
    string {
    return path.join(
      this.storageRoot,
      "current.json",
    );
  }


  save(
    candidate:
      GenesisConversationExpectedHistoryCandidate,
  ): void {
    atomicWriteJson(
      this.currentFile(),
      candidate,
    );
  }


  load():
    GenesisConversationExpectedHistoryCandidate |
    null {
    let content:
      string;

    try {
      content =
        readFileSync(
          this.currentFile(),
          "utf8",
        );
    } catch (
      error
    ) {
      const code =
        (
          error as {
            code?:
              string;
          }
        ).code;

      if (
        code ===
        "ENOENT"
      ) {
        return null;
      }

      throw error;
    }

    try {
      return JSON.parse(
        content,
      ) as GenesisConversationExpectedHistoryCandidate;
    } catch (
      error
    ) {
      throw new Error(
        "genesis_conversation_expected_history_candidate_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }
  }
}
