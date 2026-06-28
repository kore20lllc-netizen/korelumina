import type {
  OrganizationalMemoryProvider,
} from "./OrganizationalMemoryProvider.js";

import {
  organizationalMemoryProviderRegistry,
} from "./OrganizationalMemoryProviderRegistry.js";

export function registerOrganizationalMemoryProvider(
  provider: OrganizationalMemoryProvider,
): void {
  organizationalMemoryProviderRegistry.registerOrganizationalMemoryProvider(
    provider,
  );
}
