import type {
  OrganizationalMemoryInput,
  OrganizationalMemoryProvider,
  OrganizationalMemoryProviderResult,
} from "../../../knowledge/organizational-memory/index.js";

import {
  RuntimeOrganizationalMemoryStore,
} from "./RuntimeOrganizationalMemoryStore.js";

export class RuntimeOrganizationalMemoryProvider
implements OrganizationalMemoryProvider {
  readonly id =
    "runtime-organizational-memory";

  constructor(
    private readonly store =
      new RuntimeOrganizationalMemoryStore(),
  ) {}

  async recall(
    input:
      OrganizationalMemoryInput,
  ): Promise<OrganizationalMemoryProviderResult> {
    const normalizedQuery =
      input.query
        .trim()
        .toLowerCase();

    const references =
      new Set(
        input.references,
      );

    const projectIds =
      new Set(
        input.projectIds,
      );

    const teamIds =
      new Set(
        input.teamIds,
      );

    const records =
      this.store
        .list()
        .filter(
          (record) =>
            record.organizationId ===
            input.organizationId,
        )
        .filter(
          (record) =>
            !record.projectId ||
            projectIds.size === 0 ||
            projectIds.has(
              record.projectId,
            ),
        )
        .filter(
          (record) =>
            !record.teamId ||
            teamIds.size === 0 ||
            teamIds.has(
              record.teamId,
            ),
        )
        .filter(
          (record) => {
            if (
              references.size > 0 &&
              record.references.some(
                (reference) =>
                  references.has(
                    reference,
                  ),
              )
            ) {
              return true;
            }

            if (
              !normalizedQuery
            ) {
              return true;
            }

            const searchable =
              [
                record.title,
                record.summary,
                ...record.references,
              ]
                .join(" ")
                .toLowerCase();

            return searchable.includes(
              normalizedQuery,
            );
          },
        );

    return {
      records,
      insights: [],
    };
  }
}
