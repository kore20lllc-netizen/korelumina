import {
  registerSearchProvider,
} from "./SearchProviderRegistry.js";

import {
  graphSearchProvider,
} from "./GraphSearchProvider.js";

let initialized = false;

export function registerBuiltinProviders() {
  if (initialized) {
    return;
  }

  registerSearchProvider(
    graphSearchProvider,
  );

  initialized = true;
}
