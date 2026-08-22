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

import type {
  GovernanceReadySignalPublisher,
} from "../governance/index.js";

export function createKnowledgePreservationPlatform(
  governanceReadySignalPublisher?:
    GovernanceReadySignalPublisher,

  now?:
    () => number,
) {
  const platform =
    new KnowledgePreservationPlatform(
      governanceReadySignalPublisher,
      now,
    );

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
