import type {
  EvidenceItem,
} from "../../evidence/index.js";

import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import type {
  KnowledgeCompiler,
} from "../KnowledgeCompiler.js";

export class GitCompiler
  implements KnowledgeCompiler
{
  readonly name =
    "git-compiler";

  readonly version =
    "1.0.0";

  supports(
    _evidence: EvidenceItem,
  ): boolean {
    return false;
  }

  async compile(
    _evidence: EvidenceItem,
  ): Promise<
    KnowledgeIRItem[]
  > {
    return [];
  }
}
