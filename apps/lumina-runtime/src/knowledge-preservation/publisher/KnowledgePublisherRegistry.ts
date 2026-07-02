import type {
  KnowledgePublisher,
} from "./KnowledgePublisher.js";

export class KnowledgePublisherRegistry {
  private readonly publishers =
    new Map<
      string,
      KnowledgePublisher
    >();

  register(
    publisher: KnowledgePublisher,
  ): void {
    const key =
      this.publisherKey(
        publisher,
      );

    if (
      this.publishers.has(
        key,
      )
    ) {
      throw new Error(
        `Knowledge publisher already registered: ${key}`,
      );
    }

    this.publishers.set(
      key,
      publisher,
    );
  }

  list(): KnowledgePublisher[] {
    return [
      ...this.publishers.values(),
    ];
  }

  clear(): void {
    this.publishers.clear();
  }

  private publisherKey(
    publisher: KnowledgePublisher,
  ): string {
    return `${publisher.name}@${publisher.version}`;
  }
}
