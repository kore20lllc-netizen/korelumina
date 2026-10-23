import path from "node:path";

import type { EcosystemPackage } from "./Ecosystems.js";
import { parseSimpleYaml, parseToml, tomlGet, withoutXmlComments, xmlBlocks, xmlText } from "./ManifestParsers.js";

/*
 * MS-2026-0013: the exact versions a repository installs, for advisory
 * lookups. An advisory database answers for a version, not a range, so
 * versions come from lockfiles first and from exact pins in a manifest
 * second. A package with only ranges has no exact version, and is reported
 * as such rather than guessed.
 */

/* OSV ecosystem names. */
export type OsvEcosystem = "PyPI" | "Go" | "crates.io" | "Maven" | "NuGet" | "Packagist" | "RubyGems" | "Pub" | "SwiftURL";

export interface ResolvedVersion {
  ecosystem: OsvEcosystem;
  name: string;
  version: string;
  /* The lockfile or manifest it came from. */
  source: string;
  packageDirectory: string;
}

export interface ResolvedVersions {
  versions: ResolvedVersion[];
  /* Packages whose versions could not be resolved to exact ones, with why. */
  unresolved: { packageDirectory: string; ecosystem: string; reason: string }[];
}

const EXACT = /^v?\d+(\.\d+)*([-.+][0-9A-Za-z.-]+)?$/;

function add(into: ResolvedVersion[], entry: ResolvedVersion) {
  const version = entry.version.trim().replace(/^==\s*/, "");
  if (!entry.name || !EXACT.test(version)) return;
  into.push({ ...entry, version: entry.ecosystem === "Go" || entry.ecosystem === "Packagist" ? version.replace(/^v/, "") : version });
}

function tomlPackages(text: string): { name: string; version: string; source?: string }[] {
  const list = tomlGet(parseToml(text), "package");
  if (!Array.isArray(list)) return [];
  return list
    .filter((entry) => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((value) => {
      const entry = value as Record<string, unknown>;
      return {
        name: String(entry.name ?? ""),
        version: String(entry.version ?? ""),
        source: typeof entry.source === "string" ? entry.source : entry.source && typeof entry.source === "object" ? "registry" : undefined,
      };
    });
}

export function resolveVersions(packages: readonly EcosystemPackage[], read: (file: string) => string | null): ResolvedVersions {
  const versions: ResolvedVersion[] = [];
  const unresolved: ResolvedVersions["unresolved"] = [];
  for (const entry of packages) {
    if (entry.ecosystem === "node" || entry.ecosystem === "c-cpp") continue;
    const before = versions.length;
    const lock = (name: string) => entry.lockfiles.find((file) => path.posix.basename(file) === name);
    const from = (file: string | undefined, parse: (text: string, source: string) => void) => {
      if (!file) return false;
      const text = read(file);
      if (text === null) return false;
      try {
        parse(text, file);
        return true;
      } catch {
        return false;
      }
    };
    const pkg = { packageDirectory: entry.directory };

    switch (entry.ecosystem) {
      case "python": {
        const locked =
          from(lock("poetry.lock") ?? lock("uv.lock") ?? lock("pdm.lock"), (text, source) => {
            for (const item of tomlPackages(text)) add(versions, { ecosystem: "PyPI", name: item.name.toLowerCase(), version: item.version, source, ...pkg });
          }) ||
          from(lock("Pipfile.lock"), (text, source) => {
            const json = JSON.parse(text) as Record<string, Record<string, { version?: string }>>;
            for (const section of ["default", "develop"]) for (const [name, info] of Object.entries(json[section] ?? {})) add(versions, { ecosystem: "PyPI", name: name.toLowerCase(), version: info?.version ?? "", source, ...pkg });
          });
        if (!locked) for (const dependency of entry.dependencies) if (/^==\s*[^,*]+$/.test(dependency.spec ?? "")) add(versions, { ecosystem: "PyPI", name: dependency.name, version: dependency.spec!, source: entry.manifests[0], ...pkg });
        break;
      }
      case "go":
        for (const dependency of entry.dependencies) add(versions, { ecosystem: "Go", name: dependency.name, version: dependency.spec ?? "", source: entry.manifests[0], ...pkg });
        break;
      case "rust":
        from(lock("Cargo.lock"), (text, source) => {
          for (const item of tomlPackages(text)) if (item.source) add(versions, { ecosystem: "crates.io", name: item.name, version: item.version, source, ...pkg });
        });
        break;
      case "php":
        from(lock("composer.lock"), (text, source) => {
          const json = JSON.parse(text) as { packages?: { name?: string; version?: string }[]; "packages-dev"?: { name?: string; version?: string }[] };
          for (const item of [...(json.packages ?? []), ...(json["packages-dev"] ?? [])]) add(versions, { ecosystem: "Packagist", name: item.name ?? "", version: item.version ?? "", source, ...pkg });
        });
        break;
      case "ruby":
        from(lock("Gemfile.lock"), (text, source) => {
          const specs = text.match(/^GEM\n(?:.*\n)*?\s+specs:\n((?: {4}\S.*\n|(?: {6,}.*\n))*)/m)?.[1] ?? "";
          for (const match of specs.matchAll(/^ {4}([A-Za-z0-9_.-]+) \(([^)\s]+)\)/gm)) add(versions, { ecosystem: "RubyGems", name: match[1], version: match[2].replace(/-(x86|arm|universal|java|aarch64)[\w-]*$/, ""), source, ...pkg });
        });
        break;
      case "dart":
        from(lock("pubspec.lock"), (text, source) => {
          const yaml = parseSimpleYaml(text);
          const list = yaml.packages && typeof yaml.packages === "object" ? yaml.packages : {};
          for (const [name, info] of Object.entries(list)) {
            if (info && typeof info === "object" && info.source !== "sdk" && typeof info.version === "string") add(versions, { ecosystem: "Pub", name, version: info.version, source, ...pkg });
          }
        });
        break;
      case "dotnet": {
        const locked = from(lock("packages.lock.json"), (text, source) => {
          const json = JSON.parse(text) as { dependencies?: Record<string, Record<string, { resolved?: string; type?: string }>> };
          for (const frameworks of Object.values(json.dependencies ?? {})) for (const [name, info] of Object.entries(frameworks)) if (info?.type !== "Project") add(versions, { ecosystem: "NuGet", name, version: info?.resolved ?? "", source, ...pkg });
        });
        if (!locked) for (const dependency of entry.dependencies) add(versions, { ecosystem: "NuGet", name: dependency.name, version: dependency.spec ?? "", source: entry.manifests[0], ...pkg });
        break;
      }
      case "jvm": {
        const gradleLock = lock("gradle.lockfile");
        const locked = from(gradleLock, (text, source) => {
          for (const match of text.matchAll(/^([^#\s:]+):([^:\s]+):([^=\s]+)=/gm)) add(versions, { ecosystem: "Maven", name: `${match[1]}:${match[2]}`, version: match[3], source, ...pkg });
        });
        if (!locked) {
          for (const dependency of entry.dependencies) if (dependency.name.includes(":")) add(versions, { ecosystem: "Maven", name: dependency.name, version: dependency.spec ?? "", source: entry.manifests[0], ...pkg });
          if (entry.tool === "maven") {
            /* Versions managed in <dependencyManagement> or a parent are not resolved here. */
            const text = read(entry.manifests[0]);
            if (text) {
              const managed = xmlBlocks(withoutXmlComments(text), "dependencyManagement").join("");
              for (const dependency of xmlBlocks(managed, "dependency")) {
                const group = xmlText(dependency, "groupId");
                const artifact = xmlText(dependency, "artifactId");
                const version = xmlText(dependency, "version");
                if (group && artifact && version) add(versions, { ecosystem: "Maven", name: `${group}:${artifact}`, version, source: entry.manifests[0], ...pkg });
              }
            }
          }
        }
        break;
      }
      case "swift":
        from(lock("Package.resolved"), (text, source) => {
          const json = JSON.parse(text) as { pins?: { location?: string; state?: { version?: string } }[]; object?: { pins?: { repositoryURL?: string; state?: { version?: string } }[] } };
          for (const pin of json.pins ?? []) add(versions, { ecosystem: "SwiftURL", name: (pin.location ?? "").replace(/\.git$/, ""), version: pin.state?.version ?? "", source, ...pkg });
          for (const pin of json.object?.pins ?? []) add(versions, { ecosystem: "SwiftURL", name: (pin.repositoryURL ?? "").replace(/\.git$/, ""), version: pin.state?.version ?? "", source, ...pkg });
        });
        break;
    }

    if (versions.length === before && entry.dependencies.length > 0) {
      unresolved.push({
        packageDirectory: entry.directory,
        ecosystem: entry.ecosystem,
        reason: entry.tool?.includes("cocoapods") && !entry.tool.includes("swiftpm")
          ? "CocoaPods is not in the advisory database"
          : entry.lockfiles.length === 0
            ? "there is no lockfile and the manifest declares no exact versions"
            : "no exact versions could be read from the lockfile",
      });
    }
  }
  const seen = new Set<string>();
  return {
    versions: versions.filter((entry) => {
      const key = `${entry.ecosystem}\0${entry.name}\0${entry.version}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
    unresolved,
  };
}
