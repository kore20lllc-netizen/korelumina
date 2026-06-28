import type {
  ContextDocument,
} from "./ContextDocument.js";

export interface ContextValidationReport {
  valid: boolean;

  emptySections: string[];

  duplicateSectionIds: string[];

  missingSources: string[];
}

export function validateContext(
  document: ContextDocument,
): ContextValidationReport {
  const emptySections: string[] = [];
  const duplicateSectionIds: string[] = [];
  const missingSources: string[] = [];

  const ids = new Set<string>();

  for (const section of document.sections) {
    if (!section.content.trim()) {
      emptySections.push(section.id);
    }

    if (!section.source.trim()) {
      missingSources.push(section.id);
    }

    if (ids.has(section.id)) {
      duplicateSectionIds.push(section.id);
    }

    ids.add(section.id);
  }

  return {
    valid:
      emptySections.length === 0 &&
      duplicateSectionIds.length === 0 &&
      missingSources.length === 0,

    emptySections,

    duplicateSectionIds,

    missingSources,
  };
}
