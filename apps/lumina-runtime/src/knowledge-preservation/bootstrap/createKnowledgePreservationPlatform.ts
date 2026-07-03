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

  return platform;
}
