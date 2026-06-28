import {
  getContextProviders,
} from "./ContextProviderRegistry.js";

import {
  retrieve,
} from "../retrieval/RetrievalEngine.js";

import type {
  ContextDocument,
} from "./ContextDocument.js";

import type {
  ContextRequest,
} from "./ContextRequest.js";

export function assembleContext(
  request: ContextRequest,
): ContextDocument {
  const retrieval =
    retrieve({
      query:
        request.retrievalQuery,
    });

  void retrieval;

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
