import {
  genesisOperationalReactAdapter,
  useGenesisOperationalRead as useGenesisOperationalReadAdapter,
} from "@/services/runtime/genesisReplayRead";

import type {
  GenesisOperationalReactBinding,
} from "@/services/runtime/genesisReplayRead";

export function useGenesisOperationalRead():
  GenesisOperationalReactBinding {
  return useGenesisOperationalReadAdapter(
    genesisOperationalReactAdapter,
  );
}
