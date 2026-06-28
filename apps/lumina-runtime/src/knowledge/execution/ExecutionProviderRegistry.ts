import type {
  ExecutionProvider,
} from "./ExecutionProvider.js";

export class ExecutionProviderRegistry {
  private readonly providers =
    new Map<
      string,
      ExecutionProvider
    >();

  registerExecutionProvider(
    provider: ExecutionProvider,
  ): void {
    if (
      this.providers.has(
        provider.id,
      )
    ) {
      throw new Error(
        `Execution provider already registered: ${provider.id}`,
      );
    }

    this.providers.set(
      provider.id,
      provider,
    );
  }

  getExecutionProvider(
    providerId: string,
  ): ExecutionProvider | undefined {
    return this.providers.get(
      providerId,
    );
  }

  listExecutionProviders(): readonly ExecutionProvider[] {
    return [
      ...this.providers.values(),
    ];
  }
}

export const executionProviderRegistry =
  new ExecutionProviderRegistry();
