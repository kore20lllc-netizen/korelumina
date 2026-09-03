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

import {
  GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_CERTIFICATION_VERSION,
} from "./GenesisDayZeroConversationCoverageCertification.js";

import type {
  GenesisDayZeroConversationCoverageCertification,
} from "./GenesisDayZeroConversationCoverageCertification.js";


export interface GenesisDayZeroConversationCoverageCertificationPersistenceStore {
  load():
    GenesisDayZeroConversationCoverageCertification |
    null;

  save(
    certification:
      GenesisDayZeroConversationCoverageCertification,
  ):
    void;
}


function validate(
  value:
    unknown,
): GenesisDayZeroConversationCoverageCertification {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "genesis_day_zero_conversation_coverage_certification_persistence_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.certificationVersion !==
      GENESIS_DAY_ZERO_CONVERSATION_COVERAGE_CERTIFICATION_VERSION ||
    record.state !==
      "CERTIFIED" ||
    record.dayZeroConversationCoverageCertified !==
      true ||
    typeof record.certificationId !==
      "string" ||
    !record.certificationId.startsWith(
      "genesis-day-zero-conversation-coverage-certification:",
    )
  ) {
    throw new Error(
      "genesis_day_zero_conversation_coverage_certification_persistence_contract_invalid",
    );
  }

  return record as unknown as
    GenesisDayZeroConversationCoverageCertification;
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


export class FileGenesisDayZeroConversationCoverageCertificationPersistenceStore
  implements
    GenesisDayZeroConversationCoverageCertificationPersistenceStore
{
  readonly storageRoot:
    string;

  readonly certificationFile:
    string;


  constructor(
    options: {
      storageRoot?:
        string;
    } = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        path.join(
          getRuntimeDataRoot(),
          "genesis",
          "day-zero-conversation-coverage-certification",
        ),
      );

    this.certificationFile =
      path.join(
        this.storageRoot,
        "current.json",
      );
  }


  load():
    GenesisDayZeroConversationCoverageCertification |
    null {
    let raw:
      string;

    try {
      raw =
        readFileSync(
          this.certificationFile,
          "utf8",
        );
    } catch (
      error
    ) {
      if (
        (
          error as {
            code?:
              string;
          }
        ).code ===
          "ENOENT"
      ) {
        return null;
      }

      throw error;
    }

    try {
      return validate(
        JSON.parse(
          raw,
        ),
      );
    } catch (
      error
    ) {
      if (
        error instanceof
          SyntaxError
      ) {
        throw new Error(
          "genesis_day_zero_conversation_coverage_certification_persistence_corrupt_json",
          {
            cause:
              error,
          },
        );
      }

      throw error;
    }
  }


  save(
    certification:
      GenesisDayZeroConversationCoverageCertification,
  ):
    void {
    const validated =
      validate(
        certification,
      );

    const existing =
      this.load();

    if (
      existing
    ) {
      if (
        existing.certificationId ===
          validated.certificationId
      ) {
        return;
      }

      throw new Error(
        "genesis_day_zero_conversation_coverage_certification_already_exists",
      );
    }

    atomicWriteJson(
      this.certificationFile,
      validated,
    );
  }
}
