import path from "node:path";

import { ARCHIVED_PATH } from "./DependencyAnalysis.js";
import { createFinding, excerpt, type FindingEvidence, type RepositoryFinding } from "./RepositoryFinding.js";
import type { RepositoryInventory, WorkspacePackage } from "./RepositoryInventory.js";
import type { RepositorySnapshot } from "./RepositorySnapshot.js";
import { SOURCE_EXTENSIONS, classifySpecifier, extractImports, packageNameOf, type SourceImport } from "./SourceImports.js";

/*
 * MS-2026-0012: how the code is connected. Every import is resolved to a
 * file in the repository the way TypeScript and bundlers resolve it, so
 * the map can show broken imports, import cycles, how workspace packages
 * depend on each other, and files that nothing loads.
 */

export interface ModuleEdge {
  from: string;
  to: string;
  line: number;
  /* Type-only and dynamic imports cannot create load-order cycles. */
  runtime: boolean;
}

export interface ArchitectureMap {
  modules: number;
  edges: ModuleEdge[];
  entryPoints: string[];
  /* Workspace package -> workspace packages it imports. */
  packageGraph: Record<string, string[]>;
  cycles: string[][];
  unreachable: string[];
  findings: RepositoryFinding[];
}

const RESOLVE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte", ".astro", ".json", ".d.ts"];
const ASSET = /\.(css|scss|sass|less|styl|svg|png|jpe?g|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|ogg|md|mdx|txt|html|wasm|glsl|yaml|yml|toml|csv|pdf)(\?.*)?$/i;
const TEST_FILE = /(^|\/)(__tests__|__mocks__|tests?|e2e|cypress|playwright)(\/|$)|\.(test|spec|stories|bench|e2e)\.[cm]?[jt]sx?$/;
const CONFIG_FILE = /(^|\/)[\w.-]+\.config\.[cm]?[jt]s$|(^|\/)(vite-env|next-env|env)\.d\.ts$|\.d\.ts$/;
/* Files frameworks load by their location rather than by import. */
const ROUTED = /(^|\/)(?:src\/)?(?:app\/(?:.*\/)?(?:page|layout|loading|error|not-found|template|default|route|head|opengraph-image|icon|sitemap|robots|middleware|global-error)|pages\/.+|routes\/.+|middleware|instrumentation)\.[cm]?[jt]sx?$|(^|\/)supabase\/functions\/[^/]+\/index\.[jt]s$|(^|\/)api\/.+\.[cm]?[jt]s$/;

function stripJsonComments(text: string): string {
  return text
    .replace(/("(?:\\.|[^"\\])*")|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (match, string: string | undefined) => string ?? "")
    .replace(/,(\s*[}\]])/g, "$1");
}

/* alias prefix -> repository-relative target directory, from tsconfig paths and bundler alias configs. */
export function aliasTargets(snapshot: RepositorySnapshot, entry: WorkspacePackage): Map<string, string> {
  const base = entry.directory === "." ? "" : `${entry.directory}/`;
  const targets = new Map<string, string>();
  for (const file of snapshot.files) {
    if (file.ignored || !file.path.startsWith(base) || file.path.slice(base.length).includes("/")) continue;
    const name = file.path.slice(base.length);
    const text = snapshot.read(file.path);
    if (!text) continue;
    if (/^tsconfig(\.[\w-]+)?\.json$|^jsconfig\.json$/.test(name)) {
      try {
        const options = JSON.parse(stripJsonComments(text))?.compilerOptions ?? {};
        const baseUrl = typeof options.baseUrl === "string" ? options.baseUrl : ".";
        for (const [key, value] of Object.entries((options.paths ?? {}) as Record<string, unknown>)) {
          const first = Array.isArray(value) ? value[0] : null;
          if (typeof first !== "string") continue;
          const prefix = key.replace(/\*$/, "");
          const target = path.posix.normalize(path.posix.join(entry.directory, baseUrl, first.replace(/\*$/, "")));
          if (!targets.has(prefix)) targets.set(prefix, target.replace(/\/$/, ""));
        }
      } catch {
        /* An unparsable tsconfig contributes no aliases. */
      }
    }
    if (/^(vite|vitest|webpack|next|nuxt|astro|svelte)\.config\.[cm]?[jt]s$/.test(name)) {
      const block = text.match(/alias\s*:\s*(\{[\s\S]*?\}\s*[,}]|\[[\s\S]*?\])/);
      if (!block) continue;
      for (const match of block[1]!.matchAll(/["']?([@~#$\w][\w@~#$/.-]*)["']?\s*:\s*[^\n]*?["'`](\.{0,2}\/[^"'`]*)["'`]/g)) {
        if (["find", "replacement"].includes(match[1]!)) continue;
        if (!targets.has(match[1]!)) targets.set(match[1]!, path.posix.normalize(path.posix.join(entry.directory, match[2]!)).replace(/\/$/, ""));
      }
      for (const match of block[1]!.matchAll(/find\s*:\s*["']([^"']+)["'][\s\S]*?replacement\s*:[^,}]*?["'`](\.{0,2}\/[^"'`]*)["'`]/g)) {
        if (!targets.has(match[1]!)) targets.set(match[1]!, path.posix.normalize(path.posix.join(entry.directory, match[2]!)).replace(/\/$/, ""));
      }
    }
  }
  return targets;
}

function owner(file: string, packages: readonly WorkspacePackage[]): WorkspacePackage {
  let best = packages.find((entry) => entry.directory === ".") ?? packages[0]!;
  let depth = best?.directory === "." ? 0 : -1;
  for (const entry of packages) {
    if (entry.directory !== "." && file.startsWith(`${entry.directory}/`) && entry.directory.length > depth) {
      best = entry;
      depth = entry.directory.length;
    }
  }
  return best;
}

/* Tarjan's strongly connected components; returns components with more than one file, or a self-import. */
function stronglyConnected(nodes: readonly string[], next: Map<string, string[]>): string[][] {
  let index = 0;
  const indices = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];
  const visit = (start: string) => {
    const work: { node: string; edge: number }[] = [{ node: start, edge: 0 }];
    indices.set(start, index);
    low.set(start, index);
    index += 1;
    stack.push(start);
    onStack.add(start);
    while (work.length > 0) {
      const frame = work[work.length - 1]!;
      const targets = next.get(frame.node) ?? [];
      if (frame.edge < targets.length) {
        const target = targets[frame.edge++]!;
        if (!indices.has(target)) {
          indices.set(target, index);
          low.set(target, index);
          index += 1;
          stack.push(target);
          onStack.add(target);
          work.push({ node: target, edge: 0 });
        } else if (onStack.has(target)) {
          low.set(frame.node, Math.min(low.get(frame.node)!, indices.get(target)!));
        }
        continue;
      }
      work.pop();
      if (work.length > 0) {
        const parent = work[work.length - 1]!.node;
        low.set(parent, Math.min(low.get(parent)!, low.get(frame.node)!));
      }
      if (low.get(frame.node) === indices.get(frame.node)) {
        const component: string[] = [];
        let member: string;
        do {
          member = stack.pop()!;
          onStack.delete(member);
          component.push(member);
        } while (member !== frame.node);
        if (component.length > 1 || (next.get(frame.node) ?? []).includes(frame.node)) components.push(component.sort());
      }
    }
  };
  for (const node of nodes) if (!indices.has(node)) visit(node);
  return components.sort((left, right) => right.length - left.length || (left[0]! < right[0]! ? -1 : 1));
}

export function mapArchitecture(snapshot: RepositorySnapshot, inventory: RepositoryInventory): ArchitectureMap {
  const files = new Set(snapshot.files.filter((file) => !file.ignored).map((file) => file.path));
  const sources = snapshot.files
    .filter((file) => !file.ignored && file.text && SOURCE_EXTENSIONS.has(path.posix.extname(file.path).toLowerCase()))
    .map((file) => file.path);
  const packagesByName = new Map(inventory.packages.filter((entry) => entry.name).map((entry) => [entry.name!, entry]));
  /*
   * An alias that names a declared package or points into node_modules
   * (Vite deduping react, for example) is that package, not project code.
   */
  const declaredNames = new Set(
    inventory.packages.flatMap((entry) => Object.keys({ ...entry.dependencies, ...entry.devDependencies, ...entry.peerDependencies, ...entry.optionalDependencies })),
  );
  const aliases = new Map(
    inventory.packages.map((entry) => [
      entry.directory,
      new Map(
        [...aliasTargets(snapshot, entry)].filter(
          ([prefix, target]) => !declaredNames.has(prefix.replace(/\/$/, "")) && !/(^|\/)node_modules(\/|$)/.test(target),
        ),
      ),
    ]),
  );
  const rootAliases = aliases.get(".") ?? new Map<string, string>();

  const resolveFile = (candidate: string): string | null => {
    const normalized = path.posix.normalize(candidate).replace(/^\.\//, "").replace(/\/+$/, "") || ".";
    if (normalized.startsWith("..")) return null;
    if (files.has(normalized)) return normalized;
    /* TypeScript ESM: "./x.js" refers to "./x.ts". */
    const withoutJs = normalized.replace(/\.(m|c)?jsx?$/, "");
    for (const extension of RESOLVE_EXTENSIONS) {
      if (files.has(`${normalized}${extension}`)) return `${normalized}${extension}`;
      if (withoutJs !== normalized && files.has(`${withoutJs}${extension}`)) return `${withoutJs}${extension}`;
    }
    const directory = normalized === "." ? "" : `${normalized}/`;
    for (const extension of RESOLVE_EXTENSIONS) if (files.has(`${directory}index${extension}`)) return `${directory}index${extension}`;
    return null;
  };

  const packageEntry = (entry: WorkspacePackage, subpath: string): string | null => {
    const base = entry.directory === "." ? "" : `${entry.directory}/`;
    if (subpath) return resolveFile(`${base}${subpath}`) ?? resolveFile(`${base}src/${subpath}`);
    for (const candidate of [...entry.entryPoints.filter((file) => !file.includes("/dist/") && !file.endsWith(".d.ts")), `${base}src/index`, `${base}index`]) {
      const resolved = resolveFile(candidate);
      if (resolved) return resolved;
    }
    return null;
  };

  const edges: ModuleEdge[] = [];
  const broken: { file: string; found: SourceImport; text: string }[] = [];
  const packageGraph = new Map<string, Set<string>>();

  for (const file of sources) {
    const text = snapshot.read(file) ?? "";
    const entry = owner(file, inventory.packages);
    const ownAliases = new Map([...rootAliases, ...(aliases.get(entry.directory) ?? new Map())]);
    const aliasPrefixes = [...ownAliases.keys()];
    for (const found of extractImports(text)) {
      const specifier = found.specifier.split("?")[0]!;
      const kind = classifySpecifier(specifier, aliasPrefixes);
      let target: string | null = null;
      let resolvable = false;
      if (kind === "relative") {
        resolvable = true;
        target = specifier.startsWith("/")
          ? resolveFile(`${entry.directory === "." ? "" : `${entry.directory}/`}${specifier.slice(1)}`) ?? resolveFile(`${entry.directory === "." ? "" : `${entry.directory}/`}public${specifier}`)
          : resolveFile(path.posix.join(path.posix.dirname(file), specifier));
      } else if (kind === "alias") {
        const prefix = [...ownAliases.keys()]
          .filter((alias) => specifier === alias.replace(/\/$/, "") || specifier.startsWith(alias.endsWith("/") ? alias : `${alias}/`))
          .sort((left, right) => right.length - left.length)[0];
        if (prefix !== undefined) {
          resolvable = true;
          const rest = specifier.slice(prefix.replace(/\/$/, "").length).replace(/^\//, "");
          target = resolveFile(rest ? `${ownAliases.get(prefix)}/${rest}` : ownAliases.get(prefix)!);
        }
      } else if (kind === "package") {
        const name = packageNameOf(specifier);
        const internal = packagesByName.get(name);
        if (internal) {
          target = packageEntry(internal, specifier.slice(name.length).replace(/^\//, ""));
          if (internal.directory !== entry.directory) {
            const set = packageGraph.get(entry.directory) ?? new Set<string>();
            set.add(internal.directory);
            packageGraph.set(entry.directory, set);
          }
        }
      }
      if (target) {
        edges.push({ from: file, to: target, line: found.line, runtime: !found.typeOnly && found.kind !== "dynamic" });
      } else if (resolvable && !ASSET.test(specifier) && !(kind === "relative" && specifier.startsWith("/"))) {
        broken.push({ file, found, text });
      }
    }
  }

  /* Entry points: declared, conventional, routed, run by scripts, tests and configuration. */
  const entries = new Set<string>();
  for (const entry of inventory.packages) {
    for (const point of entry.entryPoints) {
      const resolved = resolveFile(point);
      if (resolved) entries.add(resolved);
    }
    const base = entry.directory === "." ? "" : `${entry.directory}/`;
    for (const script of Object.values(entry.scripts)) {
      for (const match of script.matchAll(/(?:^|\s)((?:\.\/)?[\w./-]+\.(?:[cm]?[jt]sx?))(?=\s|$)/g)) {
        const resolved = resolveFile(`${base}${match[1]!.replace(/^\.\//, "")}`);
        if (resolved) entries.add(resolved);
      }
    }
  }
  for (const file of sources) if (TEST_FILE.test(file) || CONFIG_FILE.test(file) || ROUTED.test(file)) entries.add(file);

  const next = new Map<string, string[]>();
  const runtimeNext = new Map<string, string[]>();
  for (const edge of edges) {
    next.set(edge.from, [...(next.get(edge.from) ?? []), edge.to]);
    if (edge.runtime) runtimeNext.set(edge.from, [...(runtimeNext.get(edge.from) ?? []), edge.to]);
  }

  const reached = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (reached.has(file)) continue;
    reached.add(file);
    for (const target of next.get(file) ?? []) if (!reached.has(target)) queue.push(target);
  }
  const unreachable = sources.filter((file) => !reached.has(file) && !file.endsWith(".d.ts")).sort();

  const findings: RepositoryFinding[] = [];
  const brokenByFile = new Map<string, { file: string; found: SourceImport; text: string }[]>();
  for (const item of broken) brokenByFile.set(`${item.file}\0${item.found.specifier}`, [...(brokenByFile.get(`${item.file}\0${item.found.specifier}`) ?? []), item]);
  /* Archived copies: one finding per archived folder, not one per import. */
  const archivedBroken = new Map<string, { count: number; files: Set<string>; evidence: FindingEvidence[] }>();
  for (const [, items] of [...brokenByFile].sort(([left], [right]) => (left < right ? -1 : 1))) {
    const { file, found, text } = items[0]!;
    const archived = ARCHIVED_PATH.test(file);
    if (archived) {
      const match = file.match(ARCHIVED_PATH)!;
      const root = file.slice(0, match.index! + match[0].length).replace(/\/$/, "");
      const group = archivedBroken.get(root) ?? { count: 0, files: new Set<string>(), evidence: [] };
      group.count += 1;
      group.files.add(file);
      if (group.evidence.length < 10) group.evidence.push({ file, line: found.line });
      archivedBroken.set(root, group);
      continue;
    }
    const reachedFile = reached.has(file);
    findings.push(
      createFinding({
        identity: `${file}\0${found.specifier}`,
        rule: "architecture.broken-import",
        category: "architecture",
        severity: !reachedFile ? "low" : TEST_FILE.test(file) ? "medium" : "high",
        title: `${file} imports ${found.specifier}, which does not exist${!reachedFile ? " (unused file)" : ""}`,
        detail: `No file in the repository matches "${found.specifier}" from ${file}, with any of the extensions or index files a bundler would try. ${reachedFile ? "Building or running this code fails." : "Nothing loads this file today, so it fails only if it is used again."}`,
        packageDirectory: owner(file, inventory.packages).directory,
        evidence: [{ file, line: found.line, excerpt: excerpt(text.split("\n")[found.line - 1] ?? "") }],
        remedy: "Point the import at the file's current location, or remove it.",
      }),
    );
  }
  for (const [root, group] of [...archivedBroken].sort(([left], [right]) => (left < right ? -1 : 1))) {
    findings.push(
      createFinding({
        identity: root,
        rule: "architecture.broken-imports-archived",
        category: "architecture",
        severity: "info",
        title: `${group.count} broken import${group.count === 1 ? "" : "s"} in archived code under ${root}`,
        detail: `${group.files.size} archived or backup file${group.files.size === 1 ? "" : "s"} under ${root} import files that no longer exist. Archived code is not built or run; it would fail if it were.`,
        packageDirectory: null,
        evidence: group.evidence,
        remedy: `Delete ${root} if it is only history: git keeps it.`,
      }),
    );
  }

  const cycles = stronglyConnected([...runtimeNext.keys()].sort(), runtimeNext);
  for (const cycle of cycles) {
    const members = new Set(cycle);
    const evidence: FindingEvidence[] = edges
      .filter((edge) => edge.runtime && members.has(edge.from) && members.has(edge.to))
      .slice(0, 10)
      .map((edge) => ({ file: edge.from, line: edge.line }));
    const archived = cycle.every((file) => ARCHIVED_PATH.test(file));
    findings.push(
      createFinding({
        identity: cycle.join("\0"),
        rule: "architecture.import-cycle",
        category: "architecture",
        severity: archived || cycle.every((file) => TEST_FILE.test(file)) ? "low" : cycle.length > 10 ? "medium" : "low",
        title: `${cycle.length} files import each other in a cycle`,
        detail: `${cycle.slice(0, 6).join(", ")}${cycle.length > 6 ? `, and ${cycle.length - 6} more` : ""} depend on each other at load time. Cycles make load order matter: a value read before its module finishes loading is undefined.`,
        packageDirectory: owner(cycle[0]!, inventory.packages).directory,
        evidence,
        remedy: "Move what the files share into a module that imports neither of them, or make one direction a type-only or lazy import.",
      }),
    );
  }

  const unreachableLive = unreachable.filter((file) => !ARCHIVED_PATH.test(file));
  const byPackage = new Map<string, string[]>();
  for (const file of unreachableLive) {
    const directory = owner(file, inventory.packages).directory;
    byPackage.set(directory, [...(byPackage.get(directory) ?? []), file]);
  }
  for (const [directory, list] of [...byPackage].sort(([left], [right]) => (left < right ? -1 : 1))) {
    findings.push(
      createFinding({
        identity: directory,
        rule: "architecture.unreachable-files",
        category: "architecture",
        severity: "low",
        title: `${list.length} file${list.length === 1 ? "" : "s"} in ${directory === "." ? "the project" : directory} ${list.length === 1 ? "is" : "are"} never loaded`,
        detail: `No entry point, route, script, test or configuration reaches ${list.length === 1 ? "this file" : "these files"} through imports. Files loaded by name at run time (plugins, string paths) can look unreachable.`,
        packageDirectory: directory,
        evidence: list.slice(0, 100).map((file) => ({ file })),
        remedy: "Delete what is truly unused; it still has to be read, typechecked and maintained.",
      }),
    );
  }

  return {
    modules: sources.length,
    edges,
    entryPoints: [...entries].sort(),
    packageGraph: Object.fromEntries([...packageGraph].sort(([left], [right]) => (left < right ? -1 : 1)).map(([key, value]) => [key, [...value].sort()])),
    cycles,
    unreachable,
    findings,
  };
}
