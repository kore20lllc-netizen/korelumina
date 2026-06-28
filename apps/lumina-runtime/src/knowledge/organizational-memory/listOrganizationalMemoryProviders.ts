import type {
  OrganizationalMemoryProvider,
} from "./OrganizationalMemoryProvider.js";

import {
  organizationalMemoryProviderRegistry,
} from "./OrganizationalMemoryProviderRegistry.js";

export function listOrganizationalMemoryProviders(): readonly OrganizationalMemoryProvider[] {
  return organizationalMemoryProviderRegistry.listOrganizationalMemoryProviders();
}
