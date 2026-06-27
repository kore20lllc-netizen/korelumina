import type {
  SearchRequest,
} from "./SearchRequest.js";

import type {
  SearchResponse,
} from "./SearchResponse.js";

export interface SearchProvider {
  readonly providerId: string;

  search(
    request: SearchRequest,
  ): SearchResponse;
}
