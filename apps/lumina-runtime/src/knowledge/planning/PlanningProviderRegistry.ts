import type {
  PlanningProvider,
} from "./PlanningProvider.js";

export class PlanningProviderRegistry {
  private readonly providers =
    new Map<
      string,
      PlanningProvider
    >();

  registerPlanningProvider(
    provider: PlanningProvider,
  ): void {
    if (
      this.providers.has(
        provider.id,
      )
    ) {
      throw new Error(
        `Planning provider already registered: ${provider.id}`,
      );
    }

    this.providers.set(
      provider.id,
      provider,
    );
  }

  getPlanningProvider(
    providerId: string,
  ): PlanningProvider | undefined {
    return this.providers.get(
      providerId,
    );
  }

  listPlanningProviders(): readonly PlanningProvider[] {
    return [
      ...this.providers.values(),
    ];
  }
}

export const planningProviderRegistry =
  new PlanningProviderRegistry();
