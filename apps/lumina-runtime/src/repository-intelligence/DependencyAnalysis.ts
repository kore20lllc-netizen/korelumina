import { readFileSync } from "node:fs";
import path from "node:path";

import { createFinding, excerpt, type FindingEvidence, type RepositoryFinding } from "./RepositoryFinding.js";
import type { RepositoryInventory, WorkspacePackage } from "./RepositoryInventory.js";
import type { RepositorySnapshot } from "./RepositorySnapshot.js";
import { SOURCE_EXTENSIONS, classifySpecifier, extractImports, packageNameOf } from "./SourceImports.js";

/*
 * MS-2026-0012: dependency findings read from the code itself. Every
 * finding names the package.json entry or the file and line it comes from.
 */

export interface DependencyAnalysis {
  findings: RepositoryFinding[];
  /* Per workspace package: how many imports were read and which packages they use. */
  packages: { directory: string; sourceFiles: number; imports: number; packagesImported: string[] }[];
  /* Lockfiles whose consistency with package.json was checked. */
  lockfilesChecked: string[];
}

const TEST_OR_TOOLING = /(^|\/)(__tests__|__mocks__|tests?|e2e|cypress|playwright|scripts|\.storybook|stories)(\/|$)|\.(test|spec|stories|bench)\.[cm]?[jt]sx?$|(^|\/)[\w.-]+\.config\.[cm]?[jt]s$/;
const MAX_EVIDENCE = 5;
/* Archived or backup copies: still in the repository, but not the product. */
export const ARCHIVED_PATH = /(^|\/)(archive|archived|backups?|legacy|deprecated|\.reconstruction)(\/|$)|\.(backup|bak|orig)(\.[\w-]+)?(\/|$)/i;

function stripJsonComments(text: string): string {
  let output = "";
  let inString = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (inString) {
      output += character;
      if (character === "\\") output += text[++index] ?? "";
      else if (character === '"') inString = false;
    } else if (character === '"') {
      inString = true;
      output += character;
    } else if (character === "/" && text[index + 1] === "/") {
      while (index < text.length && text[index] !== "\n") index += 1;
      output += "\n";
    } else if (character === "/" && text[index + 1] === "*") {
      index = text.indexOf("*/", index + 2);
      if (index === -1) break;
      index += 1;
    } else {
      output += character;
    }
  }
  return output.replace(/,(\s*[}\]])/g, "$1");
}

/* Prefixes a package maps to its own files: tsconfig paths and Vite/webpack aliases. */
export function projectAliases(snapshot: RepositorySnapshot, directory: string): string[] {
  const prefix = directory === "." ? "" : `${directory}/`;
  const aliases = new Set<string>();
  for (const file of snapshot.files) {
    if (file.ignored) continue;
    const local = directory === "." ? file.path : file.path.startsWith(prefix) ? file.path.slice(prefix.length) : null;
    if (local === null || local.includes("/")) continue;
    const text = snapshot.read(file.path);
    if (!text) continue;
    if (/^tsconfig(\.[\w-]+)?\.json$/.test(local) || local === "jsconfig.json") {
      try {
        const paths = JSON.parse(stripJsonComments(text))?.compilerOptions?.paths;
        if (paths && typeof paths === "object") {
          for (const key of Object.keys(paths)) aliases.add(key.replace(/\*$/, ""));
        }
      } catch {
        /* An unparsable tsconfig contributes no aliases. */
      }
    }
    if (/^(vite|vitest|webpack|next|nuxt|astro|svelte)\.config\.[cm]?[jt]s$/.test(local)) {
      const block = text.match(/alias\s*:\s*(\{[\s\S]*?\}|\[[\s\S]*?\])/);
      if (block) {
        for (const match of block[1]!.matchAll(/(?:^|[{,\s])["']?([@~#$\w][\w@~#$/.-]*)["']?\s*:/g)) {
          if (!["find", "replacement"].includes(match[1]!)) aliases.add(match[1]!);
        }
        for (const match of block[1]!.matchAll(/find\s*:\s*["']([^"']+)["']/g)) aliases.add(match[1]!);
      }
    }
  }
  return [...aliases].filter((alias) => alias.length > 0).sort();
}

/*
 * The installed package.json of a dependency, from the package's own
 * node_modules or the root's. Used only to recognize indirect use (peer
 * requirements and command-line tools); without installed packages those
 * dependencies are reported as possibly unused, as before.
 */
function installedManifest(root: string, directory: string, name: string): { bin: string[]; peers: string[] } | null {
  for (const base of directory === "." ? [root] : [path.join(root, directory), root]) {
    try {
      const manifest = JSON.parse(readFileSync(path.join(base, "node_modules", name, "package.json"), "utf8")) as {
        bin?: string | Record<string, string>;
        peerDependencies?: Record<string, string>;
      };
      const bin =
        typeof manifest.bin === "string"
          ? [name.split("/").pop()!]
          : manifest.bin && typeof manifest.bin === "object"
            ? Object.keys(manifest.bin)
            : [];
      return { bin, peers: Object.keys(manifest.peerDependencies ?? {}) };
    } catch {
      /* Not installed here. */
    }
  }
  return null;
}

function declaredIn(entry: WorkspacePackage): Map<string, string> {
  return new Map(
    Object.entries({
      ...entry.optionalDependencies,
      ...entry.peerDependencies,
      ...entry.devDependencies,
      ...entry.dependencies,
    }),
  );
}

/* The deepest workspace package containing the file; the root package contains everything. */
function owningPackage(file: string, packages: readonly WorkspacePackage[]): WorkspacePackage | null {
  let best: WorkspacePackage | null = null;
  let bestDepth = -1;
  for (const entry of packages) {
    const depth = entry.directory === "." ? 0 : file.startsWith(`${entry.directory}/`) ? entry.directory.length : -1;
    if (depth > bestDepth) {
      best = entry;
      bestDepth = depth;
    }
  }
  return best;
}

function readLockfile(snapshot: RepositorySnapshot): { file: string; importers: Map<string, Map<string, string>> } | null {
  for (const file of ["package-lock.json", "npm-shrinkwrap.json"]) {
    const text = snapshot.read(file);
    if (!text) continue;
    try {
      const lock = JSON.parse(text) as { lockfileVersion?: number; packages?: Record<string, Record<string, unknown>> };
      if (!lock.packages || (lock.lockfileVersion ?? 1) < 2) return null;
      const importers = new Map<string, Map<string, string>>();
      for (const [key, value] of Object.entries(lock.packages)) {
        if (key.includes("node_modules/")) continue;
        const declared = new Map<string, string>();
        for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
          const group = value[field];
          if (group && typeof group === "object") {
            for (const [name, range] of Object.entries(group as Record<string, unknown>)) {
              if (typeof range === "string") declared.set(name, range);
            }
          }
        }
        importers.set(key === "" ? "." : key, declared);
      }
      return { file, importers };
    } catch {
      return null;
    }
  }
  return null;
}

export function analyzeDependencies(snapshot: RepositorySnapshot, inventory: RepositoryInventory): DependencyAnalysis {
  const findings: RepositoryFinding[] = [];
  const workspaceNames = new Map(inventory.packages.filter((entry) => entry.name).map((entry) => [entry.name!, entry]));
  const root = inventory.packages.find((entry) => entry.directory === ".") ?? null;
  const rootDeclared = root ? declaredIn(root) : new Map<string, string>();
  const sourceFiles = snapshot.files.filter(
    (file) => !file.ignored && file.text && SOURCE_EXTENSIONS.has(path.posix.extname(file.path).toLowerCase()),
  );
  /* An alias that names a declared package (e.g. Vite deduping react) is still that package. */
  const allDeclared = new Set(inventory.packages.flatMap((entry) => [...declaredIn(entry).keys()]));
  const aliasesFor = new Map(
    inventory.packages.map((entry) => [
      entry.directory,
      projectAliases(snapshot, entry.directory).filter((alias) => !allDeclared.has(alias.replace(/\/$/, ""))),
    ]),
  );
  if (root) {
    const rootAliases = aliasesFor.get(".")!;
    for (const [directory, aliases] of aliasesFor) if (directory !== ".") aliasesFor.set(directory, [...new Set([...aliases, ...rootAliases])].sort());
  }

  const summaries = new Map(inventory.packages.map((entry) => [entry.directory, { directory: entry.directory, sourceFiles: 0, imports: 0, packagesImported: new Set<string>() }]));
  const undeclared = new Map<string, { entry: WorkspacePackage; name: string; evidence: FindingEvidence[]; count: number; production: boolean; live: boolean; hoisted: boolean; workspace: boolean }>();
  /* Usage across the whole repository, for root-level declarations that workspaces rely on. */
  const usedAnywhere = new Set<string>();

  for (const file of sourceFiles) {
    const entry = owningPackage(file.path, inventory.packages);
    if (!entry) continue;
    const summary = summaries.get(entry.directory)!;
    summary.sourceFiles += 1;
    const text = snapshot.read(file.path) ?? "";
    const lines = text.split("\n");
    const declared = declaredIn(entry);
    const aliases = aliasesFor.get(entry.directory) ?? [];
    for (const found of extractImports(text)) {
      summary.imports += 1;
      if (classifySpecifier(found.specifier, aliases) !== "package") continue;
      const name = packageNameOf(found.specifier);
      summary.packagesImported.add(name);
      usedAnywhere.add(name);
      if (found.typeOnly) usedAnywhere.add(`@types/${name.replace(/^@/, "").replace("/", "__")}`);
      const typesName = `@types/${name.startsWith("@") ? name.slice(1).replace("/", "__") : name}`;
      if (declared.has(name) || (found.typeOnly && declared.has(typesName)) || entry.name === name) continue;
      const hoisted = entry.directory !== "." && (rootDeclared.has(name) || (found.typeOnly && rootDeclared.has(typesName)));
      const key = `${entry.directory}\0${name}`;
      const record =
        undeclared.get(key) ??
        { entry, name, evidence: [], count: 0, production: false, live: false, hoisted, workspace: workspaceNames.has(name) };
      record.count += 1;
      const archived = ARCHIVED_PATH.test(file.path);
      record.live ||= !archived;
      record.production ||= !archived && !TEST_OR_TOOLING.test(file.path) && !(entry.directory === "." && inventory.workspaceGlobs.length > 0);
      if (record.evidence.length < MAX_EVIDENCE) {
        record.evidence.push({ file: file.path, line: found.line, excerpt: excerpt(lines[found.line - 1] ?? "") });
      }
      undeclared.set(key, record);
    }
  }

  for (const record of [...undeclared.values()].sort((left, right) => (`${left.entry.directory}\0${left.name}` < `${right.entry.directory}\0${right.name}` ? -1 : 1))) {
    const where = record.entry.directory === "." ? "the root package" : `${record.entry.directory}`;
    const times = record.count === 1 ? "once" : `${record.count} times`;
    if (record.hoisted) {
      findings.push(
        createFinding({
          identity: `${record.entry.directory}\0${record.name}`,
          rule: "dependency.relies-on-root",
          category: "dependency",
          severity: "low",
          title: `${record.name} is used by ${where} but only declared at the root`,
          detail: `${where} imports ${record.name} ${times}. It resolves today because the root package.json declares it and the package manager hoists it; it breaks if the package is installed or deployed on its own.`,
          packageDirectory: record.entry.directory,
          evidence: record.evidence,
          remedy: `Declare ${record.name} in ${record.entry.manifest}.`,
        }),
      );
      continue;
    }
    findings.push(
      createFinding({
        identity: `${record.entry.directory}\0${record.name}`,
        rule: record.workspace ? "dependency.undeclared-workspace-package" : "dependency.undeclared",
        category: "dependency",
        severity: !record.live ? "low" : record.production ? "high" : "medium",
        title: `${record.name} is imported but not declared${record.live ? "" : " (archived code)"}`,
        detail: `${where} imports ${record.name} ${times}${!record.live ? ", only from archived or backup copies" : record.production ? "" : ", only from tests, scripts, configuration or root tooling"}, but ${record.entry.manifest} does not declare it. A clean install will not provide it${record.live ? "" : "; the archived code would fail if it were run"}.`,
        packageDirectory: record.entry.directory,
        evidence: record.evidence,
        remedy: record.workspace
          ? `Add "${record.name}": "workspace:*" (or its version) to ${record.entry.manifest}.`
          : `Add ${record.name} to ${record.production ? "dependencies" : "devDependencies"} in ${record.entry.manifest}.`,
      }),
    );
  }

  /* Declared runtime dependencies nothing references. */
  const nonSourceText = (entry: WorkspacePackage) =>
    snapshot.files
      .filter((file) => !file.ignored && file.text && !SOURCE_EXTENSIONS.has(path.posix.extname(file.path).toLowerCase()))
      /* package.json and lockfiles list every dependency; they are not a use. */
      .filter((file) => !/(^|\/)(package\.json|package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lock)$/.test(file.path))
      .filter((file) => entry.directory === "." || file.path.startsWith(`${entry.directory}/`))
      .map((file) => snapshot.read(file.path) ?? "");
  const configText = (entry: WorkspacePackage) =>
    sourceFiles
      .filter((file) => TEST_OR_TOOLING.test(file.path) || /\.config\.[cm]?[jt]s$/.test(file.path))
      .filter((file) => entry.directory === "." || file.path.startsWith(`${entry.directory}/`))
      .map((file) => snapshot.read(file.path) ?? "");

  const allScripts = inventory.packages.flatMap((entry) => Object.values(entry.scripts));
  for (const entry of inventory.packages) {
    const summary = summaries.get(entry.directory)!;
    if (summary.sourceFiles === 0 && entry.directory !== ".") continue;
    const imported = entry.directory === "." && inventory.packages.length > 1 ? usedAnywhere : summary.packagesImported;
    const texts = [...nonSourceText(entry), ...configText(entry), JSON.stringify(entry.scripts)];
    /* Peers that the packages this one uses require. */
    const requiredAsPeer = new Set(
      [...declaredIn(entry).keys()]
        .filter((name) => imported.has(name))
        .flatMap((name) => installedManifest(snapshot.root, entry.directory, name)?.peers ?? []),
    );
    for (const name of Object.keys(entry.dependencies)) {
      if (imported.has(name) || name.startsWith("@types/") || requiredAsPeer.has(name)) continue;
      const mentioned = texts.some((text) => text.includes(name));
      if (mentioned) continue;
      const commands = installedManifest(snapshot.root, entry.directory, name)?.bin ?? [];
      const runByScript = commands.some((command) =>
        allScripts.some((script) => new RegExp(`(^|[\\s;&|(])${command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$|;|&|\\|)`).test(script)),
      );
      if (runByScript) continue;
      findings.push(
        createFinding({
          identity: `${entry.directory}\0${name}`,
          rule: "dependency.possibly-unused",
          category: "dependency",
          severity: "low",
          title: `${name} looks unused`,
          detail: `${entry.manifest} declares ${name} in dependencies, but no source file in ${entry.directory === "." ? "the repository" : entry.directory} imports it and no configuration, script or stylesheet mentions it. Packages loaded only by convention (plugins named in strings built at runtime) can look unused.`,
          packageDirectory: entry.directory,
          evidence: [{ file: entry.manifest }],
          remedy: `If nothing loads ${name}, remove it from ${entry.manifest}.`,
        }),
      );
    }

    for (const name of Object.keys(entry.dependencies)) {
      if (entry.devDependencies[name] === undefined) continue;
      findings.push(
        createFinding({
          identity: `${entry.directory}\0${name}`,
          rule: "dependency.declared-twice",
          category: "dependency",
          severity: "low",
          title: `${name} is in both dependencies and devDependencies`,
          detail: `${entry.manifest} declares ${name} as ${entry.dependencies[name]} and as a dev dependency ${entry.devDependencies[name]}; which one installs depends on the package manager.`,
          packageDirectory: entry.directory,
          evidence: [{ file: entry.manifest }],
          remedy: `Keep ${name} in one of the two.`,
        }),
      );
    }

    for (const [name, range] of declaredIn(entry)) {
      const trimmed = range.trim();
      const unpinned = trimmed === "" || trimmed === "*" || trimmed === "latest" || /^x(\.x)*$/i.test(trimmed);
      const remote = /^(git\+|git:|github:|gitlab:|bitbucket:|https?:)/.test(trimmed) || /^[\w-]+\/[\w.-]+(#.*)?$/.test(trimmed);
      if (!unpinned && !remote) continue;
      findings.push(
        createFinding({
          identity: `${entry.directory}\0${name}`,
          rule: unpinned ? "dependency.unpinned" : "dependency.remote-source",
          category: "dependency",
          severity: unpinned ? "medium" : "low",
          title: unpinned ? `${name} accepts any version` : `${name} is installed from a remote source`,
          detail: unpinned
            ? `${entry.manifest} declares ${name} as "${trimmed}", so every install may resolve a different, possibly breaking, version.`
            : `${entry.manifest} installs ${name} from "${trimmed}" rather than the registry; it bypasses registry integrity checks and can change without a version bump.`,
          packageDirectory: entry.directory,
          evidence: [{ file: entry.manifest }],
          remedy: unpinned ? `Declare a version range for ${name}, such as the one currently installed.` : `Publish ${name} to a registry or pin the exact commit.`,
        }),
      );
    }
  }

  /* Lockfiles. */
  const hasDependencies = inventory.packages.some((entry) => declaredIn(entry).size > 0);
  if (hasDependencies && inventory.packageManager.lockfiles.length === 0) {
    findings.push(
      createFinding({
        identity: "lockfile",
        rule: "dependency.no-lockfile",
        category: "dependency",
        severity: "medium",
        title: "No lockfile is committed",
        detail: "Dependencies are declared but no lockfile pins the versions that were tested, so each install may differ.",
        packageDirectory: ".",
        evidence: root ? [{ file: root.manifest }] : [],
        remedy: "Install once with the project's package manager and commit the lockfile it writes.",
      }),
    );
  }
  if (inventory.packageManager.conflicting) {
    findings.push(
      createFinding({
        identity: inventory.packageManager.lockfiles.join(","),
        rule: "dependency.conflicting-lockfiles",
        category: "dependency",
        severity: "medium",
        title: "Lockfiles from more than one package manager",
        detail: `${inventory.packageManager.lockfiles.join(" and ")} are both committed. Different package managers can install different versions, and only one of these files is kept up to date.`,
        packageDirectory: ".",
        evidence: inventory.packageManager.lockfiles.map((file) => ({ file })),
        remedy: "Choose one package manager, delete the other lockfiles and set \"packageManager\" in package.json.",
      }),
    );
  }

  const lock = readLockfile(snapshot);
  const lockfilesChecked: string[] = [];
  if (lock) {
    lockfilesChecked.push(lock.file);
    for (const entry of inventory.packages) {
      const locked = lock.importers.get(entry.directory);
      const declared = declaredIn(entry);
      const evidence: FindingEvidence[] = [];
      const differences: string[] = [];
      if (!locked) {
        if (declared.size === 0) continue;
        differences.push(`${entry.directory} is not in the lockfile at all`);
      } else {
        for (const [name, range] of declared) {
          const lockedRange = locked.get(name);
          if (lockedRange === undefined) differences.push(`${name} is declared but not locked`);
          else if (lockedRange !== range) differences.push(`${name} is declared as ${range} but locked as ${lockedRange}`);
        }
        for (const name of locked.keys()) if (!declared.has(name)) differences.push(`${name} is locked but no longer declared`);
      }
      if (differences.length === 0) continue;
      evidence.push({ file: entry.manifest }, { file: lock.file });
      findings.push(
        createFinding({
          identity: entry.directory,
          rule: "dependency.stale-lockfile",
          category: "dependency",
          severity: "high",
          title: `${lock.file} does not match ${entry.manifest}`,
          detail: `npm ci refuses to install when package.json and the lockfile disagree. ${differences.slice(0, 8).join("; ")}${differences.length > 8 ? `; and ${differences.length - 8} more` : ""}.`,
          packageDirectory: entry.directory,
          evidence,
          remedy: "Run npm install and commit the updated lockfile.",
        }),
      );
    }
  }

  return {
    findings,
    packages: [...summaries.values()].map((summary) => ({ ...summary, packagesImported: [...summary.packagesImported].sort() })),
    lockfilesChecked,
  };
}
