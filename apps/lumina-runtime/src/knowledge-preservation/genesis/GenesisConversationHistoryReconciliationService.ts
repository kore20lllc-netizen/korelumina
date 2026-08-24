import {
  buildGenesisConversationAcquisitionInventory,
} from "./GenesisConversationAcquisitionInventory.js";

import type {
  GenesisConversationAcquisitionExecutor,
} from "./GenesisConversationAcquisitionExecution.js";

import type {
  GenesisConversationRuntimeConfiguration,
} from "./GenesisConversationRuntimeConfiguration.js";

import {
  reconcileGenesisConversationExpectedHistory,
} from "./GenesisConversationExpectedHistoryInventory.js";

import type {
  GenesisConversationExpectedHistoryInventory,
  GenesisConversationExpectedHistoryReconciliation,
} from "./GenesisConversationExpectedHistoryInventory.js";

import type {
  FileGenesisConversationExpectedHistoryPersistenceStore,
} from "./GenesisConversationExpectedHistoryPersistence.js";


export interface GenesisConversationHistoryReconciliationProjection {
  expectedHistory:
    GenesisConversationExpectedHistoryInventory |
    null;

  acquisitionInventory:
    ReturnType<
      typeof buildGenesisConversationAcquisitionInventory
    >;

  reconciliation:
    GenesisConversationExpectedHistoryReconciliation |
    null;
}


export class GenesisConversationHistoryReconciliationService {
  constructor(
    private readonly configuration:
      GenesisConversationRuntimeConfiguration,

    private readonly acquisitionExecutor:
      GenesisConversationAcquisitionExecutor,

    private readonly expectedHistoryPersistence:
      FileGenesisConversationExpectedHistoryPersistenceStore,
  ) {}


  read():
    GenesisConversationHistoryReconciliationProjection {
    const latest =
      this.acquisitionExecutor
        .latest();

    const acquisitionInventory =
      buildGenesisConversationAcquisitionInventory({
        configuration:
          this.configuration,

        latest,
      });

    const expectedHistory =
      this.expectedHistoryPersistence
        .load();

    return {
      expectedHistory,

      acquisitionInventory,

      reconciliation:
        expectedHistory
          ? reconcileGenesisConversationExpectedHistory({
              expected:
                expectedHistory,

              acquired:
                acquisitionInventory,
            })
          : null,
    };
  }


  saveExpectedHistory(
    inventory:
      GenesisConversationExpectedHistoryInventory,
  ): GenesisConversationHistoryReconciliationProjection {
    this.expectedHistoryPersistence
      .save(
        inventory,
      );

    return this.read();
  }
}
