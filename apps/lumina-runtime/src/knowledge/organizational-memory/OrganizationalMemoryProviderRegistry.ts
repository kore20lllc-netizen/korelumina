import type {
  OrganizationalMemoryProvider,
} from "./OrganizationalMemoryProvider.js";

export class OrganizationalMemoryProviderRegistry {
  private readonly providers =
    new Map<
      string,
      OrganizationalMemoryProvider
    >();

  registerOrganizationalMemoryProvider(
    provider: OrganizationalMemoryProvider,
  ): void {
    if (
      this.providers.has(
        provider.id,
      )
    ) {
      throw new Error(
        `Organizational memory provider already registered: ${provider.id}`,
      );
    }

    this.providers.set(
      provider.id,
      provider,
    );
  }

  getOrganizationalMemoryProvider(
    providerId: string,
  ): OrganizationalMemoryProvider | undefined {
    return this.providers.get(
      providerId,
    );
  }

  listOrganizationalMemoryProviders(): readonly OrganizationalMemoryProvider[] {
    return [
      ...this.providers.values(),
    ];
  }
}

export const organizationalMemoryProviderRegistry =
  new OrganizationalMemoryProviderRegistry();
