import type {
  KnowledgeObject,
} from "./KnowledgeObject.js";

import {
  runKnowledgePipeline,
} from "./KnowledgePipeline.js";

export async function publishKnowledge(
  object: KnowledgeObject,
): Promise<void> {
  await runKnowledgePipeline(
    object,
  );
}
