import type { ProjectMetadata, ProjectOrigin } from "./projectMetadataStore.js";

/*
 * MS-2026-0013: a project's origin as Runtime knows it.
 *
 * Projects imported before origins were recorded have a git source URL in
 * their metadata, so they are git imports; that is reported as not
 * recorded at import time. A project with neither is unknown, and is not
 * treated as imported.
 */

export type ResolvedOrigin =
  | (ProjectOrigin & { recorded: true })
  | { kind: "git"; provider: string; host: string; source: string; recorded: false }
  | { kind: "unknown"; recorded: false };

function hostOf(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return "";
  }
}

function providerOf(host: string): string {
  if (host === "github.com") return "github";
  if (host === "gitlab.com") return "gitlab";
  if (host === "bitbucket.org") return "bitbucket";
  if (host === "dev.azure.com" || host.endsWith(".visualstudio.com")) return "azure-devops";
  return "git";
}

export function projectOrigin(metadata: ProjectMetadata | null | undefined): ResolvedOrigin {
  if (metadata?.origin) return { ...metadata.origin, recorded: true };
  if (metadata?.sourceUrl) {
    const host = hostOf(metadata.sourceUrl);
    return { kind: "git", provider: providerOf(host), host, source: metadata.sourceUrl, recorded: false };
  }
  return { kind: "unknown", recorded: false };
}

/* Imported from git or an uploaded archive: eligible for diagnosis and paid repair. */
export function isImportedProject(metadata: ProjectMetadata | null | undefined): boolean {
  const origin = projectOrigin(metadata);
  return origin.kind === "git" || origin.kind === "archive";
}
