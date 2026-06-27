import type {
  SearchProvider,
} from "./SearchProvider.js";

import type {
  SearchRequest,
} from "./SearchRequest.js";

import type {
  SearchResponse,
} from "./SearchResponse.js";

export const graphSearchProvider: SearchProvider = {
  providerId: "graph",

  search(
    _request: SearchRequest,
  ): SearchResponse {
    return {
      results: [],
      total: 0,
      durationMs: 0,
    };
  },
};
