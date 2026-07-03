import fs from "node:fs";

import type {
  EvidenceItem,
} from "../../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import type {
  KnowledgeCompiler,
} from "../KnowledgeCompiler.js";

interface ParsedADR {
  title: string;
  status?: string;
  decision?: string;
  consequences: string[];
}

export class ADRCompiler
  implements KnowledgeCompiler
{
  readonly name =
    "adr-compiler";

  readonly version =
    "1.1.0";

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
      this.readContent(
        evidence,
      );

    const parsed =
      this.parseADR(
        evidence,
        content,
      );

    const now =
      Date.now();

    const items: KnowledgeIRItem[] =
      [
        this.createDecisionItem(
          evidence,
          parsed,
          now,
        ),
      ];

    if (
      parsed.consequences.length > 0
    ) {
      items.push(
        this.createConsequenceItem(
          evidence,
          parsed,
          now,
        ),
      );
    }

    return items;
  }

  private readContent(
    evidence: EvidenceItem,
  ): string {
    if (
      !fs.existsSync(
        evidence.contentRef,
      )
    ) {
      return "";
    }

    return fs.readFileSync(
      evidence.contentRef,
      "utf8",
    );
  }

  private parseADR(
    evidence: EvidenceItem,
    content: string,
  ): ParsedADR {
    const title =
      this.extractTitle(
        evidence,
        content,
      );

    return {
      title,
      status:
        this.extractSectionValue(
          content,
          "status",
        ),
      decision:
        this.extractSectionValue(
          content,
          "decision",
        ) ??
        this.extractSectionValue(
          content,
          "decision outcome",
        ),
      consequences:
        this.extractListSection(
          content,
          "consequences",
        ),
    };
  }

  private extractTitle(
    evidence: EvidenceItem,
    content: string,
  ): string {
    const heading =
      content
        .split(/\r?\n/)
        .find(
          (line) =>
            line.startsWith("# "),
        );

    if (
      heading
    ) {
      return heading
        .replace(/^#\s+/, "")
        .trim();
    }

    return evidence.title;
  }

  private extractSectionValue(
    content: string,
    sectionName: string,
  ): string | undefined {
    const section =
      this.extractSection(
        content,
        sectionName,
      );

    if (
      !section
    ) {
      return undefined;
    }

    const normalized =
      section
        .replace(/\r?\n+/g, " ")
        .trim();

    return normalized.length > 0
      ? normalized
      : undefined;
  }

  private extractListSection(
    content: string,
    sectionName: string,
  ): string[] {
    const section =
      this.extractSection(
        content,
        sectionName,
      );

    if (
      !section
    ) {
      return [];
    }

    return section
      .split(/\r?\n/)
      .map(
        (line) =>
          line
            .replace(/^[-*]\s+/, "")
            .trim(),
      )
      .filter(
        (line) =>
          line.length > 0,
      );
  }

  private extractSection(
    content: string,
    sectionName: string,
  ): string | undefined {
    const escaped =
      sectionName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );

    const pattern =
      new RegExp(
        `^#{2,6}\\s+${escaped}\\s*$([\\s\\S]*?)(?=^#{2,6}\\s+|\\z)`,
        "im",
      );

    const match =
      content.match(
        pattern,
      );

    return match?.[1]?.trim();
  }

  private createDecisionItem(
    evidence: EvidenceItem,
    parsed: ParsedADR,
    extractedAt: number,
  ): KnowledgeIRItem {
    return {
      id:
        `adr:decision:${evidence.id}`,

      candidateType:
        "CandidateDecision",

      title:
        parsed.title,

      summary:
        parsed.decision ??
        "Recovered architectural decision.",

      confidence:
        parsed.decision
          ? 0.9
          : 0.7,

      evidenceRefs:
        [
          evidence.id,
        ],

      proposedRelationships:
        {},

      extractedAt,

      compiler: {
        compilerName:
          this.name,

        compilerVersion:
          this.version,

        evidenceSourceType:
          evidence.type,

        extractedAt,

        extractionMethod:
          "adr-markdown-section-extraction",

        confidenceBasis:
          parsed.decision
            ? "explicit-decision-section"
            : "adr-document-presence",
      },

      status:
        "extracted",

      metadata: {
        source:
          evidence.source,

        status:
          parsed.status,
      },
    };
  }

  private createConsequenceItem(
    evidence: EvidenceItem,
    parsed: ParsedADR,
    extractedAt: number,
  ): KnowledgeIRItem {
    return {
      id:
        `adr:consequences:${evidence.id}`,

      candidateType:
        "CandidatePrinciple",

      title:
        `${parsed.title} consequences`,

      summary:
        parsed.consequences.join(
          " ",
        ),

      confidence:
        0.85,

      evidenceRefs:
        [
          evidence.id,
        ],

      proposedRelationships:
        {
          derivedFrom: [
            `adr:decision:${evidence.id}`,
          ],
        },

      extractedAt,

      compiler: {
        compilerName:
          this.name,

        compilerVersion:
          this.version,

        evidenceSourceType:
          evidence.type,

        extractedAt,

        extractionMethod:
          "adr-consequence-section-extraction",

        confidenceBasis:
          "explicit-consequences-section",
      },

      status:
        "extracted",

      metadata: {
        source:
          evidence.source,

        consequences:
          parsed.consequences,
      },
    };
  }
}
