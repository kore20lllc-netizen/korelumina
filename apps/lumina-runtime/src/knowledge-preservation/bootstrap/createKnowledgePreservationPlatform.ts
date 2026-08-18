import {
  KnowledgePreservationPlatform,
} from "./KnowledgePreservationPlatform.js";

import {
  GitCompiler,
} from "../compiler/git/index.js";

import {
  ConversationCompiler,
} from "../compiler/conversation/index.js";

import {
  ADRCompiler,
} from "../compiler/adr/index.js";

import {
  SourceCompiler,
} from "../compiler/source/index.js";

import {
  DocumentationCompiler,
} from "../compiler/documentation/index.js";

import {
  DocumentationGovernanceValidator,
} from "../validation/documentation/index.js";

export function createKnowledgePreservationPlatform() {
  const platform =
    new KnowledgePreservationPlatform();

  platform.compilerRegistry.register(
    new GitCompiler(),
  );

  platform.compilerRegistry.register(
    new ConversationCompiler(),
  );

  platform.compilerRegistry.register(
    new ADRCompiler(),
  );

  platform.compilerRegistry.register(
    new SourceCompiler(),
  );

  platform.compilerRegistry.register(
    new DocumentationCompiler(),
  );

  platform.validationRegistry.register(
    new DocumentationGovernanceValidator(),
  );

  return platform;
}
