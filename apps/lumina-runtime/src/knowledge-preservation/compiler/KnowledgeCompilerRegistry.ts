import type {
  EvidenceItem,
} from "../evidence/index.js";

import type {
  KnowledgeCompiler,
} from "./KnowledgeCompiler.js";

export class KnowledgeCompilerRegistry {
  private readonly compilers = new Map<
    string,
    KnowledgeCompiler
  >();

  register(compiler: KnowledgeCompiler): void {
    const key = this.compilerKey(compiler);

    if (this.compilers.has(key)) {
      throw new Error(
        `Knowledge compiler already registered: ${key}`,
      );
    }

    this.compilers.set(key, compiler);
  }

  list(): KnowledgeCompiler[] {
    return [...this.compilers.values()];
  }

  findSupportingCompilers(
    evidence: EvidenceItem,
  ): KnowledgeCompiler[] {
    return this.list().filter((compiler) =>
      compiler.supports(evidence),
    );
  }

  clear(): void {
    this.compilers.clear();
  }

  private compilerKey(
    compiler: KnowledgeCompiler,
  ): string {
    return `${compiler.name}@${compiler.version}`;
  }
}
