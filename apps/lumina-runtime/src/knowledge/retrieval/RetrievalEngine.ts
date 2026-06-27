import {
  getProviders,
} from "./SearchProviderRegistry.js";

import type {
  SearchRequest,
} from "./SearchRequest.js";

import type {
  SearchResponse,
} from "./SearchResponse.js";

export function retrieve(
  request: SearchRequest,
): SearchResponse {
  const started =
    Date.now();

  const results =
    getProviders()
      .flatMap(
        (provider) =>
          provider.search(
            request,
          ).results,
      );

  return {
    results,
    total:
      results.length,
    durationMs:
      Date.now() -
      started,
  };
}
