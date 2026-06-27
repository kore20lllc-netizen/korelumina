import type {
  SearchResult,
} from "./SearchResult.js";

export interface SearchResponse {
  results: SearchResult[];

  total: number;

  durationMs: number;
}
