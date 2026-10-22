/*
 * MS-2026-0013 (Import any repository): read a repository URL from any git
 * host served over HTTPS.
 *
 * Recognised hosts get their URL shapes understood (a browser link to a
 * file or branch still finds the repository); any other host is taken as a
 * plain git server. Credentials are never accepted inside the URL: a token
 * is given separately and never stored (see GitClone). Hosts on this
 * machine or its link-local network are refused, so an import cannot reach
 * Runtime's own services or a cloud metadata endpoint.
 */

export type GitProvider = "github" | "gitlab" | "bitbucket" | "azure-devops" | "git";

export interface RepositorySource {
  provider: GitProvider;
  host: string;
  /* Path segments that name the repository, without .git. */
  path: string[];
  owner: string;
  repo: string;
  /* What git clones: https, no credentials. */
  cloneUrl: string;
  /* Stable identity for knowledge records. */
  repositoryId: string;
}

export class RepositorySourceError extends Error {}

function fail(code: string): never {
  throw new RepositorySourceError(code);
}

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);

function isBlockedHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost")) return true;
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    return a === 127 || a === 0 || (a === 169 && b === 254);
  }
  if (host.includes(":")) {
    return host === "::1" || host === "::" || host.startsWith("fe80:") || host.startsWith("::ffff:127.") || host.startsWith("::ffff:169.254.");
  }
  return false;
}

function providerOf(host: string): GitProvider {
  if (host === "github.com" || host === "www.github.com") return "github";
  if (host === "gitlab.com" || host === "www.gitlab.com") return "gitlab";
  if (host === "bitbucket.org" || host === "www.bitbucket.org") return "bitbucket";
  if (host === "dev.azure.com" || host.endsWith(".visualstudio.com")) return "azure-devops";
  return "git";
}

function repositoryPath(provider: GitProvider, host: string, segments: string[]): string[] {
  switch (provider) {
    case "github":
    case "bitbucket":
      if (segments.length < 2) fail("repository_url_must_name_owner_and_repository");
      return segments.slice(0, 2);
    case "gitlab": {
      const marker = segments.indexOf("-");
      const kept = marker >= 0 ? segments.slice(0, marker) : segments;
      if (kept.length < 2) fail("repository_url_must_name_group_and_repository");
      return kept;
    }
    case "azure-devops": {
      const git = segments.indexOf("_git");
      if (git < 0 || git + 1 >= segments.length) fail("azure_devops_url_must_include__git_and_repository");
      const minimum = host === "dev.azure.com" ? 2 : 1;
      if (git < minimum) fail("azure_devops_url_must_name_organization_and_project");
      return segments.slice(0, git + 2);
    }
    default:
      if (segments.length < 1) fail("repository_url_must_name_a_repository");
      return segments;
  }
}

export function parseRepositoryUrl(input: unknown): RepositorySource {
  const value = typeof input === "string" ? input.trim() : "";
  if (!value) fail("missing_repoUrl");
  if (/^git@|^ssh:\/\//i.test(value)) fail("ssh_urls_not_supported_use_https");

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    fail("invalid_repoUrl");
  }
  if (parsed.protocol !== "https:") fail("only_https_repo_urls_supported");
  if (parsed.username || parsed.password) fail("credentials_in_url_not_allowed_use_access_token");
  if (isBlockedHost(parsed.hostname)) fail("repository_host_not_allowed");

  const host = parsed.host.toLowerCase();
  const provider = providerOf(parsed.hostname.toLowerCase());
  const segments = parsed.pathname
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .filter(Boolean);
  if (segments.length) segments[segments.length - 1] = segments[segments.length - 1].replace(/\.git$/i, "");
  const kept = repositoryPath(provider, parsed.hostname.toLowerCase(), segments.filter(Boolean));
  if (kept.some((segment) => segment === "." || segment === ".." || /[\s\\]/.test(segment))) fail("invalid_repository_path");
  kept[kept.length - 1] = kept[kept.length - 1].replace(/\.git$/i, "");

  const repo = provider === "azure-devops" ? kept[kept.length - 1] : kept[kept.length - 1];
  const owner = provider === "azure-devops"
    ? kept.slice(0, kept.indexOf("_git")).join("/")
    : kept.slice(0, -1).join("/") || host;
  const encoded = kept.map((segment) => encodeURIComponent(segment)).join("/");
  const cloneUrl = provider === "azure-devops" ? `https://${host}/${encoded}` : `https://${host}/${encoded}.git`;
  const repositoryId = (
    provider === "github" ? `github:${kept.join("/")}`
      : provider === "git" ? `git:${host}/${kept.join("/")}`
        : `${provider}:${host}/${kept.join("/")}`
  ).toLowerCase();

  return { provider, host, path: kept, owner, repo, cloneUrl, repositoryId };
}
