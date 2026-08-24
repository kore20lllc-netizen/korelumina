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
  GenesisConversationExpectedHistoryInventory,
} from "./GenesisConversationExpectedHistoryInventory.js";


export interface GenesisConversationExpectedHistoryPersistenceOptions {
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


function readJson<T>(
  file:
    string,
): T | null {
  let content:
    string;

  try {
    content =
      readFileSync(
        file,
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
    ) as T;
  } catch (
    error
  ) {
    if (
      error instanceof
      SyntaxError
    ) {
      throw new Error(
        "genesis_conversation_expected_history_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    throw error;
  }
}


export class FileGenesisConversationExpectedHistoryPersistenceStore {
  readonly storageRoot:
    string;

  constructor(
    options:
      GenesisConversationExpectedHistoryPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
          "conversation-expected-history",
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
    inventory:
      GenesisConversationExpectedHistoryInventory,
  ): void {
    const existing =
      this.load();

    if (
      existing &&
      existing.inventoryId ===
        inventory.inventoryId
    ) {
      return;
    }

    atomicWriteJson(
      this.currentFile(),
      inventory,
    );
  }


  load():
    GenesisConversationExpectedHistoryInventory |
    null {
    return readJson<
      GenesisConversationExpectedHistoryInventory
    >(
      this.currentFile(),
    );
  }
}
