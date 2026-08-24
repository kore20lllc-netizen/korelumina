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
