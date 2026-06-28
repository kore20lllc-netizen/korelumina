import type {
  LearningProvider,
} from "./LearningProvider.js";

const providers = new Map<
  string,
  LearningProvider
>();

export function registerLearningProvider(
  provider: LearningProvider,
) {
  providers.set(
    provider.providerId,
    provider,
  );

  return provider;
}

export function unregisterLearningProvider(
  providerId: string,
) {
  return providers.delete(
    providerId,
  );
}

export function getLearningProvider(
  providerId: string,
): LearningProvider | undefined {
  return providers.get(
    providerId,
  );
}

export function getLearningProviders():
  readonly LearningProvider[] {
  return [
    ...providers.values(),
  ];
}

export function clearLearningProviders() {
  providers.clear();
}

export function learningProviderCount() {
  return providers.size;
}
