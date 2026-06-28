import type {
  ContextSection,
} from "./ContextSection.js";

export interface ContextDocument {
  sections: ContextSection[];

  metadata: Record<
    string,
    unknown
  >;

  createdAt: number;
}
