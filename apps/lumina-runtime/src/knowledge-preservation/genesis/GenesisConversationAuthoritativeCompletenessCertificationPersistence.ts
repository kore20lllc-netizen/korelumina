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
  GENESIS_CONVERSATION_AUTHORITATIVE_COMPLETENESS_CERTIFICATION_VERSION,
} from "./GenesisConversationAuthoritativeCompletenessCertification.js";

import type {
  GenesisConversationAuthoritativeCompletenessCertification,
} from "./GenesisConversationAuthoritativeCompletenessCertification.js";


export interface GenesisConversationAuthoritativeCompletenessCertificationPersistenceStore {
  load():
    GenesisConversationAuthoritativeCompletenessCertification |
    null;

  save(
    certification:
      GenesisConversationAuthoritativeCompletenessCertification,
  ):
    void;
}


function validate(
  value:
    unknown,
): GenesisConversationAuthoritativeCompletenessCertification {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value,
    )
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_certification_persistence_invalid",
    );
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  if (
    record.certificationVersion !==
      GENESIS_CONVERSATION_AUTHORITATIVE_COMPLETENESS_CERTIFICATION_VERSION ||
    record.state !==
      "CERTIFIED" ||
    typeof record.certificationId !==
      "string" ||
    !record.certificationId.startsWith(
      "genesis-conversation-authoritative-completeness-certification:",
    )
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_certification_persistence_contract_invalid",
    );
  }

  if (
    record.authoritativeExpectedHistoryCreated !==
      false ||
    record.dayZeroConversationCoverageCertified !==
      false ||
    record.promotionAvailable !==
      false
  ) {
    throw new Error(
      "genesis_conversation_authoritative_completeness_certification_persistence_boundary_invalid",
    );
  }

  return record as unknown as
    GenesisConversationAuthoritativeCompletenessCertification;
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


export class FileGenesisConversationAuthoritativeCompletenessCertificationPersistenceStore
  implements
    GenesisConversationAuthoritativeCompletenessCertificationPersistenceStore
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
          "conversation-authoritative-completeness-certification",
        ),
      );

    this.certificationFile =
      path.join(
        this.storageRoot,
        "current.json",
      );
  }


  load():
    GenesisConversationAuthoritativeCompletenessCertification |
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
          "genesis_conversation_authoritative_completeness_certification_persistence_corrupt_json",
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
      GenesisConversationAuthoritativeCompletenessCertification,
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
        "genesis_conversation_authoritative_completeness_certification_already_exists",
      );
    }

    atomicWriteJson(
      this.certificationFile,
      validated,
    );
  }
}
