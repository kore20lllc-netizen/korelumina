import type {
  SearchProvider,
} from "./SearchProvider.js";

const providers = new Map<
  string,
  SearchProvider
>();

export function registerProvider(
  provider: SearchProvider,
) {
  providers.set(
    provider.providerId,
    provider,
  );

  return provider;
}

export function unregisterProvider(
  providerId: string,
) {
  return providers.delete(
    providerId,
  );
}

export function getProvider(
  providerId: string,
): SearchProvider | undefined {
  return providers.get(
    providerId,
  );
}

export function getProviders(): readonly SearchProvider[] {
  return [
    ...providers.values(),
  ];
}

export function clearProviders() {
  providers.clear();
}

export function providerCount() {
  return providers.size;
}
