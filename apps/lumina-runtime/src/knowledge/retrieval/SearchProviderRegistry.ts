import type {
  SearchProvider,
} from "./SearchProvider.js";

const providers = new Map<
  string,
  SearchProvider
>();

export function registerSearchProvider(
  provider: SearchProvider,
) {
  providers.set(
    provider.providerId,
    provider,
  );

  return provider;
}

export function unregisterSearchProvider(
  providerId: string,
) {
  return providers.delete(
    providerId,
  );
}

export function getSearchProvider(
  providerId: string,
): SearchProvider | undefined {
  return providers.get(
    providerId,
  );
}

export function getSearchProviders(): readonly SearchProvider[] {
  return [
    ...providers.values(),
  ];
}

export function clearSearchProviders() {
  providers.clear();
}

export function searchProviderCount() {
  return providers.size;
}
