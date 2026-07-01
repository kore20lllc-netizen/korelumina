import {
  runExecutionPipeline,
  type ExecutionStage,
} from "../execution/index.js";

import type {
  KnowledgeObject,
} from "./KnowledgeObject.js";

import {
  publishKnowledgeEvent,
} from "./KnowledgeEventBus.js";

import {
  getKnowledgeProcessors,
} from "./KnowledgeProcessorRegistry.js";

function createKnowledgeEventId(
  object: KnowledgeObject,
) {
  return [
    object.type,
    object.id,
    Date.now(),
  ].join(":");
}

export async function runKnowledgePipeline(
  object: KnowledgeObject,
): Promise<void> {
  const processors =
    getKnowledgeProcessors(object);

  const stages: ExecutionStage<
    KnowledgeObject
  >[] =
    processors.map(
      (processor) => ({
        name:
          processor.constructor.name,
        async run(context) {
          await processor.process(
            context.input,
          );

          return {
            stage:
              processor.constructor.name,
            success: true,
          };
        },
      }),
    );

  await runExecutionPipeline(
    {
      id: [
        "knowledge",
        object.type,
        object.id,
      ].join(":"),
      input: object,
      state: {},
      metadata: {
        objectType:
          object.type,
        objectId:
          object.id,
      },
    },
    stages,
  );

  await publishKnowledgeEvent({
    id: createKnowledgeEventId(
      object,
    ),
    type: "knowledge.published",
    object,
    timestamp: Date.now(),
    metadata: {},
  });
}
