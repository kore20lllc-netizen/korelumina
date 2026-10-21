/*
 * MS-2026-0012: .gitignore matching without running git, so imports that
 * are not git checkouts (ZIP uploads) behave the same. Follows gitignore(5):
 * comments, "!" negation, trailing "/" for directories only, a leading or
 * inner "/" anchors to the .gitignore's directory, "*", "?", "[...]" and
 * "**". Patterns in deeper .gitignore files apply below their directory,
 * and the last matching pattern wins.
 */

interface IgnoreRule {
  base: string;
  negated: boolean;
  directoryOnly: boolean;
  expression: RegExp;
}

function toExpression(pattern: string, anchored: boolean): RegExp {
  let expression = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]!;
    if (character === "*") {
      if (pattern[index + 1] === "*") {
        const atStart = index === 0 || pattern[index - 1] === "/";
        const atEnd = index + 2 === pattern.length || pattern[index + 2] === "/";
        if (atStart && atEnd) {
          expression += index + 2 === pattern.length ? ".*" : "(?:.*/)?";
          index += pattern[index + 2] === "/" ? 2 : 1;
          continue;
        }
      }
      expression += "[^/]*";
    } else if (character === "?") {
      expression += "[^/]";
    } else if (character === "[") {
      const close = pattern.indexOf("]", index + 1);
      if (close === -1) {
        expression += "\\[";
      } else {
        const set = pattern.slice(index + 1, close).replace(/^!/, "^").replace(/\\/g, "\\\\");
        expression += `[${set}]`;
        index = close;
      }
    } else if (character === "\\" && index + 1 < pattern.length) {
      expression += pattern[index + 1]!.replace(/[.+^${}()|[\]\\*?]/g, "\\$&");
      index += 1;
    } else {
      expression += character.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${anchored ? "" : "(?:.*/)?"}${expression}$`);
}

export function parseGitIgnore(base: string, content: string): IgnoreRule[] {
  const rules: IgnoreRule[] = [];
  for (const raw of content.split(/\r?\n/)) {
    let line = raw.replace(/(?<!\\)\s+$/, "");
    if (line === "" || line.startsWith("#")) continue;
    const negated = line.startsWith("!");
    if (negated) line = line.slice(1);
    if (line.startsWith("\\#") || line.startsWith("\\!")) line = line.slice(1);
    const directoryOnly = line.endsWith("/");
    if (directoryOnly) line = line.slice(0, -1);
    if (line === "") continue;
    const anchored = line.includes("/");
    if (line.startsWith("/")) line = line.slice(1);
    rules.push({ base, negated, directoryOnly, expression: toExpression(line, anchored) });
  }
  return rules;
}

export class GitIgnoreMatcher {
  private readonly rules: IgnoreRule[] = [];

  add(base: string, content: string): void {
    this.rules.push(...parseGitIgnore(base, content));
  }

  /*
   * Git's rule: once a directory is excluded, nothing inside it can be
   * re-included, so every ancestor directory is checked first.
   */
  ignoresWithAncestors(path: string, isDirectory: boolean): boolean {
    const parts = path.split("/");
    for (let depth = 1; depth < parts.length; depth += 1) {
      if (this.ignores(parts.slice(0, depth).join("/"), true)) return true;
    }
    return this.ignores(path, isDirectory);
  }

  /* path is repository-relative with forward slashes. */
  ignores(path: string, isDirectory: boolean): boolean {
    let ignored = false;
    for (const rule of this.rules) {
      if (rule.directoryOnly && !isDirectory) continue;
      const prefix = rule.base === "" ? "" : `${rule.base}/`;
      if (prefix && !path.startsWith(prefix)) continue;
      if (rule.expression.test(path.slice(prefix.length))) ignored = !rule.negated;
    }
    return ignored;
  }
}
