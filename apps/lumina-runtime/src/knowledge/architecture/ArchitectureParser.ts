import type {
  ParsedArchitectureDocument,
  ParsedArchitectureSection,
} from "./types.js";

const HEADING =
  /^(#{1,6})\s+(.*)$/;

export function parseArchitectureDocument(
  id: string,
  markdown: string,
): ParsedArchitectureDocument {
  const lines =
    markdown.split(/\r?\n/);

  const sections: ParsedArchitectureSection[] =
    [];

  let current:
    | ParsedArchitectureSection
    | null = null;

  let title = id;

  for (const line of lines) {
    const match =
      line.match(HEADING);

    if (match) {
      if (!sections.length) {
        title =
          match[2].trim();
      }

      current = {
        level:
          match[1].length,
        heading:
          match[2].trim(),
        content: "",
      };

      sections.push(current);
      continue;
    }

    if (current) {
      current.content +=
        (current.content ? "\n" : "") +
        line;
    }
  }

  return {
    id,
    title,
    sections,
  };
}
