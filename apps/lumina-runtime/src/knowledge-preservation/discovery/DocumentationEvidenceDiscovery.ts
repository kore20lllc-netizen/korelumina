import fs from "node:fs";
import path from "node:path";

import type {
  EvidenceItem,
  EvidenceType,
} from "../evidence/index.js";

export class DocumentationEvidenceDiscovery {
  discover(
    repositoryRoot: string,
  ): EvidenceItem[] {
    const evidence: EvidenceItem[] = [];

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

      if (
        path.extname(
          entry.name,
        ) !== ".md"
      ) {
        continue;
      }

      const relativePath =
        path.relative(
          repositoryRoot,
          absolutePath,
        );

      evidence.push({
        id: relativePath,
        type: this.classify(
          relativePath,
        ),
        title: path.basename(
          entry.name,
          ".md",
        ),
        source: absolutePath,
        capturedAt: Date.now(),
        observedAt: Date.now(),
        contentRef: absolutePath,
        metadata: {},
        relationships: {},
      });
    }
  }

  private classify(
    relativePath: string,
  ): EvidenceType {
    const normalized =
      relativePath.toLowerCase();

    if (
      normalized.includes(
        "/adr",
      ) ||
      normalized.includes(
        "adr-",
      )
    ) {
      return "ADR";
    }

    if (
      normalized.includes(
        "/rfc",
      ) ||
      normalized.includes(
        "rfc-",
      )
    ) {
      return "RFC";
    }

    if (
      normalized.includes(
        "roadmap",
      )
    ) {
      return "roadmap";
    }

    if (
      normalized.includes(
        "spec",
      )
    ) {
      return "specification";
    }

    return "document";
  }
}
