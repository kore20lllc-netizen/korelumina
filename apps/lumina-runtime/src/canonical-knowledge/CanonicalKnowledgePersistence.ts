import fs from "node:fs";
import path from "node:path";
import {
  fileURLToPath,
} from "node:url";

import type {
  CanonicalKnowledgeItem,
} from "./CanonicalKnowledgeItem.js";


export interface CanonicalKnowledgePersistenceOptions {
  root?: string;
}


export class CanonicalKnowledgePersistence {
  readonly root:
    string;

  constructor(
    options:
      CanonicalKnowledgePersistenceOptions = {},
  ) {
    const environmentRoot =
      process.env
        .KORELUMINA_CANONICAL_ROOT;

    const moduleDirectory =
      path.dirname(
        fileURLToPath(
          import.meta.url,
        ),
      );

    const repositoryRoot =
      path.resolve(
        moduleDirectory,
        "../../../..",
      );

    this.root =
      options.root ??
      (
        environmentRoot &&
        environmentRoot.trim()
          ? path.resolve(
              environmentRoot,
            )
          : path.join(
              repositoryRoot,
              "runtime/knowledge/canonical-items",
            )
      );
  }


  private ensureRoot(): void {
    fs.mkdirSync(
      this.root,
      {
        recursive:
          true,
      },
    );
  }


  private filePath(
    id:
      string,
  ): string {
    return path.join(
      this.root,
      `${encodeURIComponent(
        id,
      )}.json`,
    );
  }


  save(
    item:
      CanonicalKnowledgeItem,
  ): void {
    this.ensureRoot();

    fs.writeFileSync(
      this.filePath(
        item.id,
      ),
      JSON.stringify(
        item,
        null,
        2,
      ),
      "utf8",
    );
  }


  get(
    id:
      string,
  ):
    CanonicalKnowledgeItem |
    undefined {
    const file =
      this.filePath(
        id,
      );

    if (
      !fs.existsSync(
        file,
      )
    ) {
      return undefined;
    }

    return JSON.parse(
      fs.readFileSync(
        file,
        "utf8",
      ),
    ) as CanonicalKnowledgeItem;
  }


  list():
    CanonicalKnowledgeItem[] {
    if (
      !fs.existsSync(
        this.root,
      )
    ) {
      return [];
    }

    return fs
      .readdirSync(
        this.root,
      )
      .filter(
        name =>
          name.endsWith(
            ".json",
          ),
      )
      .sort()
      .map(
        name =>
          JSON.parse(
            fs.readFileSync(
              path.join(
                this.root,
                name,
              ),
              "utf8",
            ),
          ) as CanonicalKnowledgeItem,
      );
  }


  remove(
    id:
      string,
  ): boolean {
    const file =
      this.filePath(
        id,
      );

    if (
      !fs.existsSync(
        file,
      )
    ) {
      return false;
    }

    fs.rmSync(
      file,
      {
        force:
          true,
      },
    );

    return true;
  }
}
