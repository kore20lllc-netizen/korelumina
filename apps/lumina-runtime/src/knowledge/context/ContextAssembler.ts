import {
  getContextProviders,
} from "./ContextProviderRegistry.js";

import type {
  ContextDocument,
} from "./ContextDocument.js";

import type {
  ContextRequest,
} from "./ContextRequest.js";

export function assembleContext(
  request: ContextRequest,
): ContextDocument {
  const sections =
    getContextProviders()
      .flatMap(
        (provider) =>
          provider.buildContext(
            request,
          ).sections,
      );

  return {
    sections,
    metadata: {
      providerCount:
        getContextProviders()
          .length,
    },
    createdAt:
      Date.now(),
  };
}
