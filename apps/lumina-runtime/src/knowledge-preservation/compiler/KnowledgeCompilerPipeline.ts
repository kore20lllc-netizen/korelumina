import type {
  EvidenceItem,
} from "../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import type {
  KnowledgeCompiler,
} from "./KnowledgeCompiler.js";

import {
  KnowledgeCompilerRegistry,
} from "./KnowledgeCompilerRegistry.js";

export class KnowledgeCompilerPipeline {
  constructor(
    private readonly registry: KnowledgeCompilerRegistry,
  ) {}

  async compile(
    evidence: EvidenceItem,
  ): Promise<KnowledgeIRItem[]> {
    const compilers =
      this.registry.findSupportingCompilers(
        evidence,
      );

    const output: KnowledgeIRItem[] = [];

    for (const compiler of compilers) {
      const result =
        await this.compileWith(
          compiler,
          evidence,
        );

      output.push(...result);
    }

    return output;
  }

  private async compileWith(
    compiler: KnowledgeCompiler,
    evidence: EvidenceItem,
  ): Promise<KnowledgeIRItem[]> {
    return compiler.compile(
      evidence,
    );
  }
}
