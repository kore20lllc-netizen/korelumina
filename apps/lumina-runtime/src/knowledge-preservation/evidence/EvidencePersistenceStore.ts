import {
  createHash,
} from "node:crypto";

import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import path from "node:path";

import {
  resolveKnowledgeStoragePath,
} from "../storage/index.js";

import type {
  EvidenceItem,
} from "./EvidenceItem.js";

import {
  assertValidEvidenceItem,
} from "./EvidenceIntakeContract.js";


export interface EvidencePersistenceStore {
  save(
    evidence:
      EvidenceItem,
  ): void;

  load(
    evidenceId:
      string,
  ):
    EvidenceItem |
    null;
}


export interface FileEvidencePersistenceStoreOptions {
  storageRoot?:
    string;
}


function storageKey(
  evidenceId:
    string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      evidenceId,
      "utf8",
    )
    .digest(
      "hex",
    );
}


function assertInsideRoot(
  root:
    string,

  candidate:
    string,
): void {
  const relative =
    path.relative(
      root,
      candidate,
    );

  if (
    relative ===
      ".." ||
    relative.startsWith(
      `..${path.sep}`,
    ) ||
    path.isAbsolute(
      relative,
    )
  ) {
    throw new Error(
      "evidence_persistence_path_escape",
    );
  }
}


function stableJson(
  value:
    unknown,
): string {
  return JSON.stringify(
    value,
    null,
    2,
  );
}


export class FileEvidencePersistenceStore
  implements EvidencePersistenceStore
{
  readonly storageRoot:
    string;


  constructor(
    options:
      FileEvidencePersistenceStoreOptions = {},
  ) {
    this.storageRoot =
      path.resolve(
        options.storageRoot ??
        resolveKnowledgeStoragePath(
          "evidence",
        ),
      );
  }


  private fileFor(
    evidenceId:
      string,
  ): string {
    if (
      !evidenceId.trim()
    ) {
      throw new Error(
        "evidence_persistence_invalid_id",
      );
    }

    const file =
      path.join(
        this.storageRoot,
        `${storageKey(
          evidenceId,
        )}.json`,
      );

    assertInsideRoot(
      this.storageRoot,
      file,
    );

    return file;
  }


  save(
    evidence:
      EvidenceItem,
  ): void {
    assertValidEvidenceItem(
      evidence,
    );

    const file =
      this.fileFor(
        evidence.id,
      );

    const existing =
      this.load(
        evidence.id,
      );

    if (existing) {
      if (
        stableJson(
          existing,
        ) !==
        stableJson(
          evidence,
        )
      ) {
        throw new Error(
          "evidence_persistence_identity_conflict",
        );
      }

      return;
    }

    mkdirSync(
      this.storageRoot,
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
        `${stableJson(
          evidence,
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


  load(
    evidenceId:
      string,
  ):
    EvidenceItem |
    null {
    const file =
      this.fileFor(
        evidenceId,
      );

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

    let parsed:
      unknown;

    try {
      parsed =
        JSON.parse(
          content,
        );
    } catch (
      error
    ) {
      throw new Error(
        "evidence_persistence_corrupt_json",
        {
          cause:
            error,
        },
      );
    }

    assertValidEvidenceItem(
      parsed,
    );

    if (
      parsed.id !==
      evidenceId
    ) {
      throw new Error(
        "evidence_persistence_identity_mismatch",
      );
    }

    return parsed;
  }
}
