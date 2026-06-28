import type {
  EngineerAgentProvider,
} from "./EngineerAgentProvider.js";

export class EngineerAgentProviderRegistry {
  private readonly providers =
    new Map<
      string,
      EngineerAgentProvider
    >();

  registerEngineerAgentProvider(
    provider: EngineerAgentProvider,
  ): void {
    if (
      this.providers.has(
        provider.id,
      )
    ) {
      throw new Error(
        `Engineer agent provider already registered: ${provider.id}`,
      );
    }

    this.providers.set(
      provider.id,
      provider,
    );
  }

  getEngineerAgentProvider(
    providerId: string,
  ): EngineerAgentProvider | undefined {
    return this.providers.get(
      providerId,
    );
  }

  listEngineerAgentProviders(): readonly EngineerAgentProvider[] {
    return [
      ...this.providers.values(),
    ];
  }
}

export const engineerAgentProviderRegistry =
  new EngineerAgentProviderRegistry();
