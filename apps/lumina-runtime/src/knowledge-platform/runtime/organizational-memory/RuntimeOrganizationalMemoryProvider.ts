import type {
  OrganizationalMemoryInput,
  OrganizationalMemoryProvider,
  OrganizationalMemoryProviderResult,
} from "../../../knowledge/organizational-memory/index.js";

import type {
  OrganizationalMemoryRecord,
} from "../../../knowledge/organizational-memory/index.js";

import {
  RuntimeOrganizationalMemoryStore,
} from "./RuntimeOrganizationalMemoryStore.js";

export interface RuntimeOrganizationalMemoryReadStore {
  list():
    OrganizationalMemoryRecord[];
}


export class RuntimeOrganizationalMemoryProvider
implements OrganizationalMemoryProvider {
  readonly id =
    "runtime-organizational-memory";

  constructor(
    private readonly store:
      RuntimeOrganizationalMemoryReadStore =
        new RuntimeOrganizationalMemoryStore(),
  ) {}

  async recall(
    input:
      OrganizationalMemoryInput,
  ): Promise<OrganizationalMemoryProviderResult> {
    const queryTerms =
      input.query
        .toLowerCase()
        .split(
          /[^a-z0-9]+/,
        )
        .map(
          (term) =>
            term.trim(),
        )
        .filter(
          (term) =>
            term.length >= 4,
        );

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
              queryTerms.length === 0
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

            return queryTerms.some(
              (term) =>
                searchable.includes(
                  term,
                ),
            );
          },
        );

    return {
      records,
      insights: [],
    };
  }
}
