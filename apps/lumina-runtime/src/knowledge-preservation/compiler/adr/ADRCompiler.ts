import fs from "node:fs";

import type {
  EvidenceItem,
} from "../../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import {
  ADRKnowledgeExtractor,
} from "../../extractors/index.js";

import type {
  KnowledgeCompiler,
} from "../KnowledgeCompiler.js";

export class ADRCompiler
  implements KnowledgeCompiler
{
  readonly name =
    "adr-compiler";

  readonly version =
    "2.0.0";

  private readonly extractor =
    new ADRKnowledgeExtractor();

  supports(
    evidence: EvidenceItem,
  ): boolean {
    return (
      evidence.type ===
      "ADR"
    );
  }

  async compile(
    evidence: EvidenceItem,
  ): Promise<
    KnowledgeIRItem[]
  > {
    if (
      !this.supports(
        evidence,
      )
    ) {
      return [];
    }

    const content =
      fs.existsSync(
        evidence.contentRef,
      )
        ? fs.readFileSync(
            evidence.contentRef,
            "utf8",
          )
        : "";

    return this.extractor.extract(
      evidence.title,
      content,
    );
  }
}
