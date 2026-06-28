import type {
  OrganizationalMemoryProvider,
} from "./OrganizationalMemoryProvider.js";

import {
  organizationalMemoryProviderRegistry,
} from "./OrganizationalMemoryProviderRegistry.js";

export function getOrganizationalMemoryProvider(
  providerId: string,
): OrganizationalMemoryProvider | undefined {
  return organizationalMemoryProviderRegistry.getOrganizationalMemoryProvider(
    providerId,
  );
}
