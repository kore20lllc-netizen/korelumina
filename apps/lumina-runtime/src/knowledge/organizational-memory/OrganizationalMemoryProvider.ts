import type {
  OrganizationalMemoryInput,
} from "./OrganizationalMemoryInput.js";

import type {
  OrganizationalMemoryInsight,
} from "./OrganizationalMemoryInsight.js";

import type {
  OrganizationalMemoryRecord,
} from "./OrganizationalMemoryRecord.js";

export interface OrganizationalMemoryProviderResult {
  records: OrganizationalMemoryRecord[];

  insights: OrganizationalMemoryInsight[];
}

export interface OrganizationalMemoryProvider {
  id: string;

  recall(
    input: OrganizationalMemoryInput,
  ): Promise<OrganizationalMemoryProviderResult>;
}
