export interface ContextSection {
  id: string;

  title: string;

  content: string;

  source: string;

  metadata: Record<
    string,
    unknown
  >;
}
