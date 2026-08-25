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
  GenesisConversationExpectedHistoryCandidateReview,
} from "./GenesisConversationExpectedHistoryCandidateReview.js";


export interface GenesisConversationExpectedHistoryCandidateReviewPersistenceOptions {
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


export class FileGenesisConversationExpectedHistoryCandidateReviewPersistenceStore {
  readonly storageRoot:
    string;

  constructor(
    options:
      GenesisConversationExpectedHistoryCandidateReviewPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
          "conversation-expected-history-candidate-review",
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
    review:
      GenesisConversationExpectedHistoryCandidateReview,
  ): void {
    atomicWriteJson(
      this.currentFile(),
      review,
    );
  }


  load():
    GenesisConversationExpectedHistoryCandidateReview |
    null {
    try {
      return JSON.parse(
        readFileSync(
          this.currentFile(),
          "utf8",
        ),
      ) as GenesisConversationExpectedHistoryCandidateReview;
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

      if (
        error instanceof
        SyntaxError
      ) {
        throw new Error(
          "genesis_conversation_expected_history_candidate_review_persistence_corrupt_json",
          {
            cause:
              error,
          },
        );
      }

      throw error;
    }
  }
}
