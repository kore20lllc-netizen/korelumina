import fs from "node:fs";
import path from "node:path";

import type {
  EvidenceItem,
} from "../evidence/index.js";

export class RepositoryEvidenceDiscovery {
  discover(
    repositoryRoot: string,
  ): EvidenceItem[] {
    const evidence: EvidenceItem[] =
      [];

    this.walk(
      repositoryRoot,
      repositoryRoot,
      evidence,
    );

    return evidence;
  }

  private walk(
    repositoryRoot: string,
    currentPath: string,
    evidence: EvidenceItem[],
  ): void {
    for (const entry of fs.readdirSync(
      currentPath,
      {
        withFileTypes: true,
      },
    )) {
      if (
        entry.name === ".git" ||
        entry.name === "node_modules" ||
        entry.name === "dist"
      ) {
        continue;
      }

      const absolutePath =
        path.join(
          currentPath,
          entry.name,
        );

      if (
        entry.isDirectory()
      ) {
        this.walk(
          repositoryRoot,
          absolutePath,
          evidence,
        );

        continue;
      }

      evidence.push({
        id:
          path.relative(
            repositoryRoot,
            absolutePath,
          ),

        type:
          "source-file",

        title:
          entry.name,

        source:
          absolutePath,

        capturedAt:
          Date.now(),

        observedAt:
          Date.now(),

        contentRef:
          absolutePath,

        metadata: {},

        relationships: {},
      });
    }
  }
}
