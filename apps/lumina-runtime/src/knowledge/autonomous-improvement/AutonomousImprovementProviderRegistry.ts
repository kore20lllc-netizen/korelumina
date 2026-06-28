import type {
  AutonomousImprovementProvider,
} from "./AutonomousImprovementProvider.js";

export class AutonomousImprovementProviderRegistry {
  private readonly providers =
    new Map<
      string,
      AutonomousImprovementProvider
    >();

  registerAutonomousImprovementProvider(
    provider: AutonomousImprovementProvider,
  ): void {
    if (
      this.providers.has(
        provider.id,
      )
    ) {
      throw new Error(
        `Autonomous improvement provider already registered: ${provider.id}`,
      );
    }

    this.providers.set(
      provider.id,
      provider,
    );
  }

  getAutonomousImprovementProvider(
    providerId: string,
  ): AutonomousImprovementProvider | undefined {
    return this.providers.get(
      providerId,
    );
  }

  listAutonomousImprovementProviders(): readonly AutonomousImprovementProvider[] {
    return [
      ...this.providers.values(),
    ];
  }
}

export const autonomousImprovementProviderRegistry =
  new AutonomousImprovementProviderRegistry();
