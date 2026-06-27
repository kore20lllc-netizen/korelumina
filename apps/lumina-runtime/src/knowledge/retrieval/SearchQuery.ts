export interface SearchQuery {
  expression: string;

  limit?: number;

  offset?: number;

  filters?: Record<string, string>;
}
