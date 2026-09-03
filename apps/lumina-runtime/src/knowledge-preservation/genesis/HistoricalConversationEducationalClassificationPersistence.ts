import {
  readFileSync,
  readdirSync,
} from "node:fs";

import {
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";

import {
  dirname,
  join,
} from "node:path";

import {
  validateHistoricalConversationEducationalClassification,
  type HistoricalConversationEducationalClassification,
} from "./HistoricalConversationEducationalClassification.js";


export interface HistoricalConversationEducationalClassificationPersistenceOptions {
  rootDir:
    string;
}


function classificationDirectory(
  rootDir:
    string,
): string {
  return join(
    rootDir,
    "historical-conversation-educational-classifications",
  );
}


function classificationPath(
  rootDir:
    string,
  classificationId:
    string,
): string {
  const safeId =
    encodeURIComponent(
      classificationId,
    );

  return join(
    classificationDirectory(
      rootDir,
    ),
    `${safeId}.json`,
  );
}


async function readJsonFile<T>(
  path:
    string,
): Promise<T | null> {
  try {
    const raw =
      await readFile(
        path,
        "utf8",
      );

    return JSON.parse(
      raw,
    ) as T;
  } catch (
    error
  ) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}


async function atomicWriteJson(
  path:
    string,
  value:
    unknown,
): Promise<void> {
  await mkdir(
    dirname(
      path,
    ),
    {
      recursive:
        true,
    },
  );

  const temporaryPath =
    `${path}.tmp-${process.pid}-${Date.now()}`;

  await writeFile(
    temporaryPath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );

  await rename(
    temporaryPath,
    path,
  );
}


export class HistoricalConversationEducationalClassificationPersistence {
  private readonly rootDir:
    string;


  public constructor(
    options:
      HistoricalConversationEducationalClassificationPersistenceOptions,
  ) {
    this.rootDir =
      options.rootDir;
  }


  public async read(
    classificationId:
      string,
  ): Promise<HistoricalConversationEducationalClassification | null> {
    return readJsonFile<HistoricalConversationEducationalClassification>(
      classificationPath(
        this.rootDir,
        classificationId,
      ),
    );
  }


  public async save(
    classification:
      HistoricalConversationEducationalClassification,
  ): Promise<HistoricalConversationEducationalClassification> {
    const validation =
      validateHistoricalConversationEducationalClassification(
        classification,
      );

    if (
      validation.state !==
      "VALID"
    ) {
      throw new Error(
        `historical_conversation_educational_classification_persistence_invalid:${validation.reason}`,
      );
    }

    const path =
      classificationPath(
        this.rootDir,
        classification.classificationId,
      );

    const existing =
      await readJsonFile<HistoricalConversationEducationalClassification>(
        path,
      );

    if (
      existing
    ) {
      if (
        JSON.stringify(
          existing,
        ) ===
        JSON.stringify(
          classification,
        )
      ) {
        return existing;
      }

      throw new Error(
        "historical_conversation_educational_classification_persistence_identity_conflict",
      );
    }

    await atomicWriteJson(
      path,
      classification,
    );

    return classification;
  }


  public listSync():
    HistoricalConversationEducationalClassification[] {
    const directory =
      classificationDirectory(
        this.rootDir,
      );

    let filenames:
      string[];

    try {
      filenames =
        readdirSync(
          directory,
        );
    } catch (
      error
    ) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return [];
      }

      throw error;
    }

    const classifications:
      HistoricalConversationEducationalClassification[] =
        [];

    for (
      const filename
      of filenames.sort()
    ) {
      if (
        !filename.endsWith(
          ".json",
        )
      ) {
        continue;
      }

      const raw =
        readFileSync(
          join(
            directory,
            filename,
          ),
          "utf8",
        );

      const classification =
        JSON.parse(
          raw,
        ) as HistoricalConversationEducationalClassification;

      const validation =
        validateHistoricalConversationEducationalClassification(
          classification,
        );

      if (
        validation.state !==
          "VALID"
      ) {
        throw new Error(
          `historical_conversation_educational_classification_persistence_invalid:${validation.reason}`,
        );
      }

      classifications.push(
        classification,
      );
    }

    return classifications.sort(
      (
        left,
        right,
      ) =>
        left.classificationId.localeCompare(
          right.classificationId,
        ),
    );
  }


  public async list(): Promise<
    HistoricalConversationEducationalClassification[]
  > {
    const directory =
      classificationDirectory(
        this.rootDir,
      );

    let filenames:
      string[];

    try {
      filenames =
        await readdir(
          directory,
        );
    } catch (
      error
    ) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return [];
      }

      throw error;
    }

    const classifications:
      HistoricalConversationEducationalClassification[] =
        [];

    for (
      const filename
      of filenames.sort()
    ) {
      if (
        !filename.endsWith(
          ".json",
        )
      ) {
        continue;
      }

      const classification =
        await readJsonFile<HistoricalConversationEducationalClassification>(
          join(
            directory,
            filename,
          ),
        );

      if (
        classification
      ) {
        classifications.push(
          classification,
        );
      }
    }

    return classifications;
  }


  public async listByConversationId(
    conversationId:
      string,
  ): Promise<
    HistoricalConversationEducationalClassification[]
  > {
    const classifications =
      await this.list();

    return classifications.filter(
      (
        classification,
      ) =>
        classification.conversationId ===
        conversationId,
    );
  }
}
