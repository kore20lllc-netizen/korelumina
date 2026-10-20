import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import type {
  GenesisHistoricalOutputGovernanceProjection,
} from "./GenesisHistoricalOutputGovernance.js";


export interface GenesisCanonicalConsumptionStore {
  list():
    CanonicalKnowledgeItem[];
}


export class GenesisCurrentPolicyCanonicalView
implements GenesisCanonicalConsumptionStore {
  private readonly suppressedCanonicalIds:
    ReadonlySet<string>;

  constructor(
    private readonly canonicalStore:
      GenesisCanonicalConsumptionStore,

    historicalOutputGovernance:
      GenesisHistoricalOutputGovernanceProjection,

    /*
     * F-28: canonical ids the owner retired from current policy with a
     * committed retirement record. They stay in the canonical store.
     */
    retiredCanonicalIds:
      readonly string[] = [],
  ) {
    this.suppressedCanonicalIds =
      new Set(
        historicalOutputGovernance
          .records
          .filter(
            record =>
              record.currentPolicyStatus ===
              "historical-output-not-currently-authorized",
          )
          .flatMap(
            record =>
              record.canonicalKnowledgeIds,
          )
          .concat(
            retiredCanonicalIds,
          ),
      );
  }


  list():
    CanonicalKnowledgeItem[] {
    return this.canonicalStore
      .list()
      .filter(
        item =>
          !this.suppressedCanonicalIds
            .has(
              item.id,
            ),
      );
  }


  suppressedIds():
    readonly string[] {
    return [
      ...this.suppressedCanonicalIds,
    ].sort();
  }
}
