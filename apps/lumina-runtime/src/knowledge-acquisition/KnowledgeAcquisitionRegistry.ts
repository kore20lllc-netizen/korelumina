import type {
  KnowledgeAcquisitionProvider,
} from "./KnowledgeAcquisitionProvider.js";

export class KnowledgeAcquisitionRegistry {
  private readonly providers =
    new Map<
      string,
      KnowledgeAcquisitionProvider
    >();

  register(
    provider: KnowledgeAcquisitionProvider,
  ): void {
    const key =
      this.providerKey(
        provider,
      );

    if (
      this.providers.has(
        key,
      )
    ) {
      throw new Error(
        `Knowledge acquisition provider already registered: ${key}`,
      );
    }

    this.providers.set(
      key,
      provider,
    );
  }

  list(): KnowledgeAcquisitionProvider[] {
    return [
      ...this.providers.values(),
    ];
  }

  clear(): void {
    this.providers.clear();
  }

  private providerKey(
    provider: KnowledgeAcquisitionProvider,
  ): string {
    return `${provider.metadata.name}@${provider.metadata.version}`;
  }
}
