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
  GenesisConversationExpectedHistoryAmendment,
} from "./GenesisConversationExpectedHistoryAmendment.js";

import type {
  GenesisConversationExpectedHistoryInventory,
} from "./GenesisConversationExpectedHistoryInventory.js";


export interface GenesisConversationExpectedHistoryAmendmentPersistenceOptions {
  storageRoot?:
    string;
}


export interface GenesisConversationExpectedHistoryAmendmentLineageRecord {
  previousInventory:
    GenesisConversationExpectedHistoryInventory;

  amendment:
    GenesisConversationExpectedHistoryAmendment;
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
  let raw:
    string;

  try {
    raw =
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
      raw,
    ) as T;
  } catch (
    error
  ) {
    if (
      error instanceof
      SyntaxError
    ) {
      throw new Error(
        "genesis_conversation_expected_history_amendment_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    throw error;
  }
}


function validateLineage(
  value:
    GenesisConversationExpectedHistoryAmendmentLineageRecord,
): void {
  if (
    !value ||
    typeof value !==
      "object" ||
    !value.previousInventory ||
    !value.amendment
  ) {
    throw new Error(
      "genesis_conversation_expected_history_amendment_persistence_invalid",
    );
  }

  if (
    value.amendment.previousInventoryId !==
    value.previousInventory.inventoryId
  ) {
    throw new Error(
      "genesis_conversation_expected_history_amendment_previous_inventory_mismatch",
    );
  }

  if (
    value.amendment.amendedInventoryId !==
    value.amendment.inventory.inventoryId
  ) {
    throw new Error(
      "genesis_conversation_expected_history_amendment_amended_inventory_mismatch",
    );
  }

  if (
    !value.amendment.amendmentId.startsWith(
      "genesis-conversation-expected-history-amendment:",
    )
  ) {
    throw new Error(
      "genesis_conversation_expected_history_amendment_id_invalid",
    );
  }
}


function equalJson(
  left:
    unknown,

  right:
    unknown,
): boolean {
  return JSON.stringify(
    left,
  ) ===
    JSON.stringify(
      right,
    );
}


export class FileGenesisConversationExpectedHistoryAmendmentPersistenceStore {
  readonly storageRoot:
    string;

  constructor(
    options:
      GenesisConversationExpectedHistoryAmendmentPersistenceOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
          "conversation-expected-history-amendments",
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


  private historyFile(
    amendmentId:
      string,
  ): string {
    return path.join(
      this.storageRoot,
      "history",
      `${amendmentId}.json`,
    );
  }


  loadCurrent():
    GenesisConversationExpectedHistoryAmendmentLineageRecord |
    null {
    const record =
      readJson<
        GenesisConversationExpectedHistoryAmendmentLineageRecord
      >(
        this.currentFile(),
      );

    if (
      record
    ) {
      validateLineage(
        record,
      );
    }

    return record;
  }


  loadById(
    amendmentId:
      string,
  ):
    GenesisConversationExpectedHistoryAmendmentLineageRecord |
    null {
    const record =
      readJson<
        GenesisConversationExpectedHistoryAmendmentLineageRecord
      >(
        this.historyFile(
          amendmentId,
        ),
      );

    if (
      record
    ) {
      validateLineage(
        record,
      );
    }

    return record;
  }


  save(
    record:
      GenesisConversationExpectedHistoryAmendmentLineageRecord,
  ): void {
    validateLineage(
      record,
    );

    const historyFile =
      this.historyFile(
        record.amendment.amendmentId,
      );

    const existing =
      this.loadById(
        record.amendment.amendmentId,
      );

    if (
      existing
    ) {
      if (
        !equalJson(
          existing,
          record,
        )
      ) {
        throw new Error(
          "genesis_conversation_expected_history_amendment_persistence_identity_conflict",
        );
      }
    } else {
      /*
       * Immutable lineage is written before current projection.
       * A restart can therefore safely resume the authoritative
       * inventory replacement from the preserved lineage record.
       */
      atomicWriteJson(
        historyFile,
        record,
      );
    }

    const current =
      this.loadCurrent();

    if (
      current &&
      current.amendment.amendmentId ===
        record.amendment.amendmentId &&
      equalJson(
        current,
        record,
      )
    ) {
      return;
    }

    atomicWriteJson(
      this.currentFile(),
      record,
    );
  }
}
