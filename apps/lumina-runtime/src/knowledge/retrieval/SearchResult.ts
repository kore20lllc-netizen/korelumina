export interface SearchResult {
  id: string;

  type: string;

  title: string;

  excerpt: string;

  score: number;

  metadata: Record<string, unknown>;
}
