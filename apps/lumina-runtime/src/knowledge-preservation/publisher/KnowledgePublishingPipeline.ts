import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import type {
  KnowledgePublisher,
} from "./KnowledgePublisher.js";

import {
  KnowledgePublisherRegistry,
} from "./KnowledgePublisherRegistry.js";

export class KnowledgePublishingPipeline {
  constructor(
    private readonly registry: KnowledgePublisherRegistry,
  ) {}

  async publish(
    items: readonly KnowledgeIRItem[],
  ): Promise<void> {
    const publishers =
      this.registry.list();

    for (const publisher of publishers) {
      await this.publishWith(
        publisher,
        items,
      );
    }
  }

  private async publishWith(
    publisher: KnowledgePublisher,
    items: readonly KnowledgeIRItem[],
  ): Promise<void> {
    await publisher.publish(
      items,
    );
  }
}
