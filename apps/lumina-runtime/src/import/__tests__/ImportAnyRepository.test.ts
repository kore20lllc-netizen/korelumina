import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { explainGitFailure, gitEnvironment, runGit, scrub, type GitRunner } from "../GitClone.js";
import { parseRepositoryUrl, RepositorySourceError } from "../RepositorySource.js";

/* MS-2026-0013: import from any git host over HTTPS, with a token that is never stored. */

test("each git host's repository URL, including browser links, resolves to what git clones", () => {
  const cases: Array<[string, string, string, string, string]> = [
    ["https://github.com/acme/shop", "github", "https://github.com/acme/shop.git", "acme", "github:acme/shop"],
    ["https://github.com/acme/shop.git", "github", "https://github.com/acme/shop.git", "acme", "github:acme/shop"],
    ["https://github.com/acme/shop/tree/main/src", "github", "https://github.com/acme/shop.git", "acme", "github:acme/shop"],
    ["https://gitlab.com/acme/platform/api", "gitlab", "https://gitlab.com/acme/platform/api.git", "acme/platform", "gitlab:gitlab.com/acme/platform/api"],
    ["https://gitlab.com/acme/platform/api/-/tree/main", "gitlab", "https://gitlab.com/acme/platform/api.git", "acme/platform", "gitlab:gitlab.com/acme/platform/api"],
    ["https://bitbucket.org/team/app/src/main/", "bitbucket", "https://bitbucket.org/team/app.git", "team", "bitbucket:bitbucket.org/team/app"],
    ["https://dev.azure.com/org/Project/_git/Repo", "azure-devops", "https://dev.azure.com/org/Project/_git/Repo", "org/Project", "azure-devops:dev.azure.com/org/project/_git/repo"],
    ["https://org.visualstudio.com/Project/_git/Repo", "azure-devops", "https://org.visualstudio.com/Project/_git/Repo", "Project", "azure-devops:org.visualstudio.com/project/_git/repo"],
    ["https://git.example.com/scm/team/legacy.git", "git", "https://git.example.com/scm/team/legacy.git", "scm/team", "git:git.example.com/scm/team/legacy"],
    ["https://code.example.org:8443/repo", "git", "https://code.example.org:8443/repo.git", "code.example.org:8443", "git:code.example.org:8443/repo"],
  ];
  for (const [url, provider, cloneUrl, owner, repositoryId] of cases) {
    const source = parseRepositoryUrl(url);
    assert.equal(source.provider, provider, url);
    assert.equal(source.cloneUrl, cloneUrl, url);
    assert.equal(source.owner, owner, url);
    assert.equal(source.repositoryId, repositoryId, url);
  }
});

test("URLs that are unsafe or incomplete are refused with a reason", () => {
  const refused: Array<[unknown, string]> = [
    ["", "missing_repoUrl"],
    ["git@github.com:acme/shop.git", "ssh_urls_not_supported_use_https"],
    ["http://github.com/acme/shop", "only_https_repo_urls_supported"],
    ["https://user:secret@github.com/acme/shop", "credentials_in_url_not_allowed_use_access_token"],
    ["https://ghp_token@gitlab.com/acme/api", "credentials_in_url_not_allowed_use_access_token"],
    ["https://localhost/repo", "repository_host_not_allowed"],
    ["https://127.0.0.1/repo", "repository_host_not_allowed"],
    ["https://169.254.169.254/latest", "repository_host_not_allowed"],
    ["https://[::1]/repo", "repository_host_not_allowed"],
    ["https://github.com/acme", "repository_url_must_name_owner_and_repository"],
    ["https://dev.azure.com/org/Project", "azure_devops_url_must_include__git_and_repository"],
    ["https://git.example.com/", "repository_url_must_name_a_repository"],
  ];
  for (const [url, reason] of refused) {
    assert.throws(() => parseRepositoryUrl(url), (error: unknown) => error instanceof RepositorySourceError && error.message === reason, String(url));
  }
});

test("a token reaches git only as a header in its environment, with no prompts and none of Runtime's secrets", () => {
  const env = gitEnvironment("gitlab", { token: "glpat-SECRET" }, { PATH: "/usr/bin", HOME: "/home/x", SUPABASE_SERVICE_ROLE_KEY: "service", STRIPE_WEBHOOK_SECRET: "whsec" });
  assert.equal(env.GIT_TERMINAL_PROMPT, "0");
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, undefined);
  assert.equal(env.STRIPE_WEBHOOK_SECRET, undefined);
  assert.equal(env.GIT_CONFIG_KEY_0, "http.extraHeader");
  assert.equal(env.GIT_CONFIG_VALUE_0, `Authorization: Basic ${Buffer.from("oauth2:glpat-SECRET").toString("base64")}`);
  assert.equal(gitEnvironment("azure-devops", { token: "pat" }).GIT_CONFIG_VALUE_0, `Authorization: Basic ${Buffer.from(":pat").toString("base64")}`);
  assert.equal(gitEnvironment("github", { token: "t", username: "me" }).GIT_CONFIG_VALUE_0, `Authorization: Basic ${Buffer.from("me:t").toString("base64")}`);
  assert.equal(gitEnvironment("github", null).GIT_CONFIG_COUNT, undefined);
  assert.equal(gitEnvironment("gitlab", { token: "t" }, {}, "https://gitlab.com/").GIT_CONFIG_KEY_0, "http.https://gitlab.com/.extraHeader", "the header is scoped to the repository's own host");
});

test("nothing git prints carries the token, and failures become reasons a person can act on", async () => {
  const credentials = { token: "ghp_SECRET123" };
  const header = Buffer.from("x-access-token:ghp_SECRET123").toString("base64");
  assert.equal(scrub(`fatal: ghp_SECRET123 and ${header}`, credentials).includes("SECRET"), false);
  assert.equal(scrub(`fatal: ${header}`, credentials).includes(header), false);

  const failing: GitRunner = async () => {
    throw new Error("fatal: Authentication failed for 'https://github.com/acme/private.git/' token ghp_SECRET123");
  };
  await assert.rejects(
    runGit(["clone", "--", "https://github.com/acme/private.git", "/tmp/x"], { cwd: "/tmp", provider: "github", credentials, runner: failing }),
    (error: Error & { detail?: string }) => error.message === "repository_access_denied_check_url_or_token" && !String(error.detail).includes("SECRET"),
  );
  await assert.rejects(
    runGit(["clone"], { cwd: "/tmp", provider: "github", credentials: null, runner: async () => { throw new Error("fatal: could not read Username for 'https://github.com': terminal prompts disabled"); } }),
    /^Error: repository_not_found_or_private_add_access_token$/,
  );
  assert.equal(explainGitFailure("fatal: could not read Username for 'https://gitlab.com': terminal prompts disabled"), "repository_access_denied_check_url_or_token");
  assert.equal(explainGitFailure("remote: Repository not found."), "repository_not_found_or_private");
  assert.equal(explainGitFailure("fatal: unable to access: Could not resolve host: git.example.com"), "repository_host_unreachable");
  assert.equal(explainGitFailure("git_timed_out"), "repository_clone_timed_out");
});

test("a real clone with a token leaves no trace of it in the copy", async () => {
  const work = mkdtempSync(path.join(tmpdir(), "korelumina-import-"));
  const origin = path.join(work, "origin");
  execFileSync("git", ["init", "-q", origin]);
  writeFileSync(path.join(origin, "package.json"), '{"name":"x"}\n');
  execFileSync("git", ["-C", origin, "add", "."]);
  execFileSync("git", ["-C", origin, "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "-m", "init"]);
  const copy = path.join(work, "copy");
  await runGit(["clone", "--depth", "1", "--no-tags", "--", `file://${origin}`, copy], { cwd: work, provider: "git", credentials: { token: "tok_NEVER_STORED" } });
  assert.ok(existsSync(path.join(copy, "package.json")));
  assert.equal(readFileSync(path.join(copy, ".git", "config"), "utf8").includes("NEVER_STORED"), false);
  assert.equal(readFileSync(path.join(copy, ".git", "config"), "utf8").includes("extraHeader"), false);
  await runGit(["pull", "--ff-only"], { cwd: copy, provider: "git", credentials: null });
});
