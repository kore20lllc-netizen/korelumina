import { builtinModules } from "node:module";

/*
 * MS-2026-0012: the module specifiers a source file imports, with their
 * lines. Comments are blanked first (strings are kept), so a commented-out
 * import does not count and line numbers stay exact.
 */

export const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte", ".astro"]);

export type ImportKind = "static" | "side-effect" | "re-export" | "dynamic" | "require";

export interface SourceImport {
  specifier: string;
  line: number;
  kind: ImportKind;
  typeOnly: boolean;
}

const BUILTINS = new Set(builtinModules.flatMap((name) => [name, name.replace(/^node:/, "")]));

export interface ScannedSource {
  /* Same length as the input; comments become spaces, newlines are kept. */
  code: string;
  /* 1 for every character inside a string or template literal, quotes included. */
  inString: Uint8Array;
  /* Offsets of opening quotes. */
  stringStarts: Set<number>;
}

export function scanSource(text: string): ScannedSource {
  const output = text.split("");
  const inString = new Uint8Array(text.length);
  const stringStarts = new Set<number>();
  let index = 0;
  const blank = (from: number, to: number) => {
    for (let position = from; position < to; position += 1) if (output[position] !== "\n") output[position] = " ";
  };
  while (index < text.length) {
    const character = text[index]!;
    const next = text[index + 1];
    if (character === "/" && next === "/") {
      const end = text.indexOf("\n", index);
      const stop = end === -1 ? text.length : end;
      blank(index, stop);
      index = stop;
    } else if (character === "/" && next === "*") {
      const end = text.indexOf("*/", index + 2);
      const stop = end === -1 ? text.length : end + 2;
      blank(index, stop);
      index = stop;
    } else if (character === '"' || character === "'" || character === "`") {
      const start = index;
      stringStarts.add(start);
      index += 1;
      while (index < text.length && text[index] !== character) {
        if (text[index] === "\\") index += 1;
        else if (character !== "`" && text[index] === "\n") break;
        index += 1;
      }
      index += 1;
      inString.fill(1, start, Math.min(index, text.length));
    } else {
      index += 1;
    }
  }
  return { code: output.join(""), inString, stringStarts };
}

export function blankComments(text: string): string {
  return scanSource(text).code;
}

const PATTERNS: readonly { kind: ImportKind; expression: RegExp }[] = [
  { kind: "static", expression: /\bimport\s+(type\s+)?(?:[\w$*{}\s,]+?)\s+from\s*(["'])([^"'\n]+)\2/g },
  { kind: "re-export", expression: /\bexport\s+(type\s+)?(?:[\w$*{}\s,]+?)\s+from\s*(["'])([^"'\n]+)\2/g },
  { kind: "side-effect", expression: /\bimport\s*()(["'])([^"'\n]+)\2/g },
  { kind: "dynamic", expression: /\bimport\s*\(\s*()(["'])([^"'\n]+)\2\s*\)/g },
  { kind: "require", expression: /\brequire\s*\(\s*()(["'])([^"'\n]+)\2\s*\)/g },
];

export function extractImports(text: string): SourceImport[] {
  const { code, inString, stringStarts } = scanSource(text);
  const lineStarts = [0];
  for (let index = 0; index < code.length; index += 1) if (code[index] === "\n") lineStarts.push(index + 1);
  const lineOf = (offset: number) => {
    let low = 0;
    let high = lineStarts.length - 1;
    while (low < high) {
      const middle = (low + high + 1) >> 1;
      if (lineStarts[middle]! <= offset) low = middle;
      else high = middle - 1;
    }
    return low + 1;
  };

  const found: SourceImport[] = [];
  const seen = new Set<string>();
  for (const { kind, expression } of PATTERNS) {
    for (const match of code.matchAll(expression)) {
      const specifier = match[3]!;
      const offset = match.index! + match[0].lastIndexOf(specifier);
      /* The keyword must be code, and the specifier a string literal of its own. */
      if (inString[match.index!] || !stringStarts.has(offset - 1)) continue;
      const key = `${offset}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ specifier, line: lineOf(offset), kind, typeOnly: Boolean(match[1]) });
    }
  }
  return found.sort((left, right) => left.line - right.line || (left.specifier < right.specifier ? -1 : 1));
}

export type SpecifierClass = "relative" | "builtin" | "virtual" | "alias" | "package";

/* aliases: prefixes the project maps to its own files, e.g. "@/" or "~/". */
export function classifySpecifier(specifier: string, aliases: readonly string[]): SpecifierClass {
  if (specifier.startsWith(".") || specifier.startsWith("/")) return "relative";
  if (specifier.startsWith("node:") || BUILTINS.has(specifier.split("/")[0]!)) return "builtin";
  /* "@" or "@/" matches "@/x", never "@radix-ui/x": an alias is a whole path segment. */
  if (
    aliases.some((alias) => {
      const bare = alias.replace(/\/$/, "");
      return specifier === bare || specifier.startsWith(`${bare}/`);
    })
  ) {
    return "alias";
  }
  if (/^[a-z][\w+.-]*:/i.test(specifier) || specifier.startsWith("#") || specifier.startsWith("~") || specifier.startsWith("@/")) {
    return specifier.startsWith("~") || specifier.startsWith("@/") || specifier.startsWith("#") ? "alias" : "virtual";
  }
  return "package";
}

/* "@scope/name/sub" -> "@scope/name", "name/sub" -> "name". */
export function packageNameOf(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!;
}
