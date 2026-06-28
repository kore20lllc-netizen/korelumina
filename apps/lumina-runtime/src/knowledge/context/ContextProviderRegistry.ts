import type {
  ContextProvider,
} from "./ContextProvider.js";

const providers = new Map<
  string,
  ContextProvider
>();

export function registerContextProvider(
  provider: ContextProvider,
) {
  providers.set(
    provider.providerId,
    provider,
  );

  return provider;
}

export function unregisterContextProvider(
  providerId: string,
) {
  return providers.delete(
    providerId,
  );
}

export function getContextProvider(
  providerId: string,
): ContextProvider | undefined {
  return providers.get(
    providerId,
  );
}

export function getContextProviders(): readonly ContextProvider[] {
  return [
    ...providers.values(),
  ];
}

export function clearContextProviders() {
  providers.clear();
}

export function contextProviderCount() {
  return providers.size;
}
