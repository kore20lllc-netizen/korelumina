import {
  genesisReplayReactAdapter,
  useGenesisReplayRead as useGenesisReplayReadAdapter,
} from "@/services/runtime/genesisReplayRead";

import type {
  GenesisReplayReactBinding,
} from "@/services/runtime/genesisReplayRead";

export function useGenesisReplayRead():
  GenesisReplayReactBinding {
  return useGenesisReplayReadAdapter(
    genesisReplayReactAdapter,
  );
}
