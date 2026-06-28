import type {
  SearchQuery,
} from "../retrieval/SearchQuery.js";

export interface ContextRequest {
  retrievalQuery: SearchQuery;
}
