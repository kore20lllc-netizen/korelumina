import type {
  OrganizationalMemoryRecord,
} from "../../knowledge/organizational-memory/index.js";

import type {
  GenesisRuntimeCanonicalConsumptionResolution,
} from "./GenesisRuntimeCanonicalConsumptionView.js";


export interface GenesisOrganizationalMemoryConsumptionStore {
  list():
    OrganizationalMemoryRecord[];
}


export class GenesisCurrentPolicyOrganizationalMemoryView
implements GenesisOrganizationalMemoryConsumptionStore {
  constructor(
    private readonly source:
      GenesisOrganizationalMemoryConsumptionStore,

    private readonly canonicalConsumption:
      Pick<
        GenesisRuntimeCanonicalConsumptionResolution,
        "state" |
        "suppressedCanonicalIds"
      >,
  ) {}


  list():
    OrganizationalMemoryRecord[] {
    if (
      this.canonicalConsumption.state !==
      "ACTIVE"
    ) {
      return [];
    }

    const suppressedCanonicalIds =
      new Set(
        this.canonicalConsumption
          .suppressedCanonicalIds,
      );

    return this.source
      .list()
      .filter(
        record => {
          const canonicalItemId =
            record.governance
              ?.canonicalItemId;

          /*
           * Memory without canonical governance lineage is not
           * implicitly withdrawn by Genesis canonical policy.
           */
          if (
            !canonicalItemId
          ) {
            return true;
          }

          return !suppressedCanonicalIds
            .has(
              canonicalItemId,
            );
        },
      );
  }


  suppressedMemoryIds():
    readonly string[] {
    if (
      this.canonicalConsumption.state !==
      "ACTIVE"
    ) {
      return this.source
        .list()
        .map(
          record =>
            record.id,
        )
        .sort();
    }

    const suppressedCanonicalIds =
      new Set(
        this.canonicalConsumption
          .suppressedCanonicalIds,
      );

    return this.source
      .list()
      .filter(
        record => {
          const canonicalItemId =
            record.governance
              ?.canonicalItemId;

          return (
            canonicalItemId !==
              undefined &&
            suppressedCanonicalIds.has(
              canonicalItemId,
            )
          );
        },
      )
      .map(
        record =>
          record.id,
      )
      .sort();
  }
}
