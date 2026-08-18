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

    const extracted =
      await this.extractor.extract(
        evidence.title,
        content,
      );

    /*
     * The extractor owns structural extraction.
     * ADRCompiler owns the authoritative Evidence -> Knowledge IR
     * boundary, so provenance and compiler attribution must be
     * corrected here before IR leaves the compiler.
     */
    return extracted.map(
      (item) => ({
        ...item,

        evidenceRefs: [
          ...new Set([
            ...item.evidenceRefs,
            evidence.id,
          ]),
        ],

        compiler: {
          ...item.compiler,

          compilerName:
            this.name,

          compilerVersion:
            this.version,

          evidenceSourceType:
            evidence.type,

          extractedAt:
            item.compiler.extractedAt,

          extractionMethod:
            this.name,
        },

        metadata: {
          ...item.metadata,

          source:
            evidence.source,

          contentRef:
            evidence.contentRef,
        },
      }),
    );
  }
}
