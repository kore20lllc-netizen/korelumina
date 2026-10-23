import { ECOSYSTEM_LABEL, type EcosystemPackage } from "./Ecosystems.js";
import { createFinding, type RepositoryFinding } from "./RepositoryFinding.js";

/*
 * MS-2026-0013 (any language): dependency checks for the ecosystems other
 * than Node, from their manifests and lockfiles alone.
 *
 * - A manifest that cannot be read.
 * - Dependencies with no lockfile where the ecosystem's tool makes one, so
 *   two installs can resolve different versions.
 * - Dependencies with no version constraint at all, or a wildcard.
 * Each finding names the package directory; one finding per manifest
 * lists every unpinned dependency rather than one finding each.
 */

/* Tools whose install writes a lockfile that belongs in the repository. */
const LOCKFILE_EXPECTED: Record<string, string> = {
  poetry: "poetry.lock",
  uv: "uv.lock",
  pdm: "pdm.lock",
  pipenv: "Pipfile.lock",
  go: "go.sum",
  cargo: "Cargo.lock",
  composer: "composer.lock",
  bundler: "Gemfile.lock",
  flutter: "pubspec.lock",
  dart: "pubspec.lock",
  cocoapods: "Podfile.lock",
};

function unpinned(entry: EcosystemPackage): string[] {
  return entry.dependencies
    .filter((dependency) => dependency.scope !== "indirect")
    .filter((dependency) => {
      const spec = (dependency.spec ?? "").trim();
      if (spec.startsWith("git ") || spec.startsWith("path ")) return false;
      /* Maven versions often come from a parent or a BOM; an absent one is not evidence. */
      if (entry.tool === "maven" && spec === "") return false;
      if (entry.ecosystem === "c-cpp" && spec === "") return false;
      if (entry.ecosystem === "swift" && entry.tool?.includes("xcode")) return false;
      return spec === "" || spec === "*" || spec === "latest" || spec === "latest.release" || spec === "latest.integration" || /(^|:)\+$/.test(spec) || spec === "any";
    })
    .map((dependency) => dependency.name);
}

export function checkEcosystemDependencies(packages: readonly EcosystemPackage[]): RepositoryFinding[] {
  const findings: RepositoryFinding[] = [];
  for (const entry of packages) {
    if (entry.ecosystem === "node") continue;
    const where = entry.directory === "." ? "the repository root" : entry.directory;
    const label = ECOSYSTEM_LABEL[entry.ecosystem];
    const manifest = entry.manifests[0] ?? entry.directory;

    for (const error of entry.parseErrors) {
      const file = error.split(": ")[0];
      findings.push(
        createFinding({
          identity: error,
          rule: "dependency.manifest-unreadable",
          category: "dependency",
          severity: "medium",
          title: `${file} could not be read`,
          detail: `${error}. Its dependencies were not analyzed.`,
          packageDirectory: entry.directory,
          evidence: [{ file }],
          remedy: "Fix the syntax so the file parses.",
        }),
      );
    }

    const runtime = entry.dependencies.filter((dependency) => dependency.scope !== "indirect");
    const lock = entry.tool ? entry.tool.split("+").map((tool) => LOCKFILE_EXPECTED[tool]).find(Boolean) : undefined;
    if (lock && runtime.length > 0 && entry.lockfiles.length === 0) {
      findings.push(
        createFinding({
          identity: `${entry.ecosystem}\0${entry.directory}`,
          rule: "dependency.lockfile-missing",
          category: "dependency",
          severity: "medium",
          title: `${label} package in ${where} has no ${lock}`,
          detail: `${manifest} declares ${runtime.length} dependenc${runtime.length === 1 ? "y" : "ies"} but no ${lock} is committed, so two installs can resolve different versions.`,
          packageDirectory: entry.directory,
          evidence: [{ file: manifest }],
          remedy: `Run ${entry.tool?.split("+")[0]}'s install or lock command and commit ${lock}.`,
        }),
      );
    }

    const loose = unpinned(entry);
    if (loose.length > 0) {
      const pinnedByLock = entry.lockfiles.length > 0;
      findings.push(
        createFinding({
          identity: `${entry.ecosystem}\0${entry.directory}`,
          rule: "dependency.unpinned",
          category: "dependency",
          severity: pinnedByLock ? "info" : "low",
          title: `${loose.length} ${label} dependenc${loose.length === 1 ? "y has" : "ies have"} no version constraint in ${where}`,
          detail: `${loose.slice(0, 12).join(", ")}${loose.length > 12 ? ` and ${loose.length - 12} more` : ""}. ${pinnedByLock ? "The lockfile pins them today, but any update can take a new major version." : "Each install takes whatever version is newest, including breaking ones."}`,
          packageDirectory: entry.directory,
          evidence: entry.manifests.map((file) => ({ file })),
          remedy: "Give each dependency a version range (for example ~=, ^ or a minimum and maximum).",
        }),
      );
    }
  }
  return findings;
}
