import {
  KnowledgePreservationPlatform,
} from "./KnowledgePreservationPlatform.js";

import {
  GitCompiler,
} from "../compiler/git/index.js";

import {
  ConversationCompiler,
} from "../compiler/conversation/index.js";

export function createKnowledgePreservationPlatform() {
  const platform =
    new KnowledgePreservationPlatform();

  platform.compilerRegistry.register(
    new GitCompiler(),
  );

  platform.compilerRegistry.register(
    new ConversationCompiler(),
  );

  return platform;
}
