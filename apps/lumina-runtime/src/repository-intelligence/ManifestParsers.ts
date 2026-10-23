/*
 * MS-2026-0013: small, tolerant readers for the manifest formats other
 * ecosystems use. They read only what dependency and package analysis
 * needs (names, versions, dependency tables) and never execute anything:
 * setup.py, build.gradle and Package.swift are read as text, not run.
 */

/* ---------- TOML (the subset manifests use) ---------- */

export type TomlValue = string | number | boolean | TomlValue[] | { [key: string]: TomlValue };
export type TomlTable = { [key: string]: TomlValue };

function stripComment(line: string): string {
  let quote: string | null = null;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (char === "\\" && quote === '"') index += 1;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === "#") return line.slice(0, index);
  }
  return line;
}

function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === "\\" && quote === '"') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === "[" || char === "{") depth += 1;
    else if (char === "]" || char === "}") depth -= 1;
    else if (char === separator && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

function unquoteKey(key: string): string {
  const trimmed = key.trim();
  return /^(["']).*\1$/.test(trimmed) ? trimmed.slice(1, -1) : trimmed;
}

function tomlValue(raw: string): TomlValue {
  const value = raw.trim();
  if (value.startsWith('"""') || value.startsWith("'''")) return value.slice(3, value.length - 3);
  if (value.startsWith('"')) return value.slice(1, value.lastIndexOf('"')).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  if (value.startsWith("'")) return value.slice(1, value.lastIndexOf("'"));
  if (value.startsWith("[")) return splitTopLevel(value.slice(1, value.lastIndexOf("]")), ",").map(tomlValue);
  if (value.startsWith("{")) {
    const table: TomlTable = {};
    for (const pair of splitTopLevel(value.slice(1, value.lastIndexOf("}")), ",")) {
      const equals = pair.indexOf("=");
      if (equals > 0) table[unquoteKey(pair.slice(0, equals))] = tomlValue(pair.slice(equals + 1));
    }
    return table;
  }
  if (value === "true" || value === "false") return value === "true";
  const number = Number(value.replace(/_/g, ""));
  return Number.isFinite(number) && value !== "" ? number : value;
}

function balanced(text: string): boolean {
  let depth = 0;
  let quote: string | null = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === "\\" && quote === '"') index += 1;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === "[" || char === "{") depth += 1;
    else if (char === "]" || char === "}") depth -= 1;
  }
  return depth <= 0 && quote === null;
}

function tableAt(root: TomlTable, keys: string[], arrayOfTables: boolean): TomlTable {
  let table = root;
  keys.forEach((key, index) => {
    const last = index === keys.length - 1;
    if (last && arrayOfTables) {
      const list = Array.isArray(table[key]) ? (table[key] as TomlValue[]) : [];
      const entry: TomlTable = {};
      list.push(entry);
      table[key] = list;
      table = entry;
      return;
    }
    const existing = table[key];
    if (Array.isArray(existing)) {
      table = existing[existing.length - 1] as TomlTable;
    } else if (existing && typeof existing === "object") {
      table = existing as TomlTable;
    } else {
      const next: TomlTable = {};
      table[key] = next;
      table = next;
    }
  });
  return table;
}

export function parseToml(text: string): TomlTable {
  const root: TomlTable = {};
  let current = root;
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = stripComment(lines[index]).trim();
    if (!line) continue;
    const header = line.match(/^(\[\[?)\s*([^\]]+?)\s*\]\]?$/);
    if (header) {
      current = tableAt(root, splitTopLevel(header[2], ".").map(unquoteKey), header[1] === "[[");
      continue;
    }
    const equals = line.indexOf("=");
    if (equals <= 0) continue;
    const keys = splitTopLevel(line.slice(0, equals), ".").map(unquoteKey);
    let raw = line.slice(equals + 1).trim();
    if (raw.startsWith('"""') || raw.startsWith("'''")) {
      const fence = raw.slice(0, 3);
      while (!(raw.length > 3 && raw.endsWith(fence)) && index + 1 < lines.length) raw += `\n${lines[(index += 1)]}`;
    } else {
      while (!balanced(raw) && index + 1 < lines.length) raw += ` ${stripComment(lines[(index += 1)]).trim()}`;
    }
    const target = keys.length > 1 ? tableAt(current, keys.slice(0, -1), false) : current;
    target[keys[keys.length - 1]] = tomlValue(raw);
  }
  return root;
}

export function tomlGet(table: TomlValue | undefined, ...keys: string[]): TomlValue | undefined {
  let value: TomlValue | undefined = table;
  for (const key of keys) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    value = (value as TomlTable)[key];
  }
  return value;
}

/* ---------- YAML (pubspec: nested maps of scalars) ---------- */

export type YamlMap = { [key: string]: string | YamlMap | null };

export function parseSimpleYaml(text: string): YamlMap {
  const root: YamlMap = {};
  const stack: { indent: number; map: YamlMap }[] = [{ indent: -1, map: root }];
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim() || /^\s*#/.test(rawLine) || /^\s*-/.test(rawLine)) continue;
    const match = rawLine.match(/^(\s*)([^:#][^:]*?):\s*(.*)$/);
    if (!match) continue;
    const indent = match[1].length;
    const key = match[2].trim().replace(/^(["'])(.*)\1$/, "$2");
    const value = match[3].replace(/\s+#.*$/, "").trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].map;
    if (value === "" || value === "|" || value === ">") {
      const child: YamlMap = {};
      parent[key] = child;
      stack.push({ indent, map: child });
    } else {
      parent[key] = value.replace(/^(["'])(.*)\1$/, "$2");
    }
  }
  return root;
}

/* ---------- XML (pom.xml, *.csproj): element text by tag ---------- */

export function xmlBlocks(xml: string, tag: string): string[] {
  const blocks: string[] = [];
  const pattern = new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "g");
  for (const match of xml.matchAll(pattern)) blocks.push(match[2]);
  return blocks;
}

export function xmlText(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>\\s*([^<]*?)\\s*</${tag}>`));
  return match ? match[1] : null;
}

export function xmlAttribute(element: string, attribute: string): string | null {
  const match = element.match(new RegExp(`\\b${attribute}\\s*=\\s*"([^"]*)"`, "i"));
  return match ? match[1] : null;
}

export function withoutXmlComments(xml: string): string {
  return xml.replace(/<!--[\s\S]*?-->/g, "");
}
