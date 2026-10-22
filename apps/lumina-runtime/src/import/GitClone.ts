import { spawn } from "node:child_process";

import type { GitProvider } from "./RepositorySource.js";

/*
 * MS-2026-0013: clone or update a repository with git, safely.
 *
 * - A private repository's token reaches git only through this process's
 *   environment (GIT_CONFIG_* sets an HTTP Authorization header for this
 *   command alone). It is never in the URL, the command line, .git/config,
 *   project metadata, logs or the result, and anything git prints is
 *   scrubbed of it.
 * - git never asks for input (GIT_TERMINAL_PROMPT=0), so a private
 *   repository without a token fails fast instead of hanging.
 * - git gets a minimal environment, never Runtime's secrets.
 * - Every command has a time limit.
 */

export interface GitCredentials {
  token: string;
  /* Optional; each provider has a default user name for token access. */
  username?: string;
}

export const DEFAULT_GIT_TIMEOUT_MS = 10 * 60 * 1000;

const TOKEN_USER: Record<GitProvider, string> = {
  github: "x-access-token",
  gitlab: "oauth2",
  bitbucket: "x-token-auth",
  "azure-devops": "",
  git: "oauth2",
};

const PASSED_THROUGH = ["PATH", "HOME", "LANG", "LC_ALL", "TMPDIR", "SYSTEMROOT", "HTTPS_PROXY", "https_proxy", "NO_PROXY", "no_proxy", "SSL_CERT_FILE", "GIT_SSL_CAINFO"];

export function gitEnvironment(
  provider: GitProvider,
  credentials: GitCredentials | null,
  base: NodeJS.ProcessEnv = process.env,
  /* The header is sent only to this origin (for example https://gitlab.com/), never to a host a redirect points at. */
  scopeUrl?: string,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of PASSED_THROUGH) if (base[key] !== undefined) env[key] = base[key];
  env.GIT_TERMINAL_PROMPT = "0";
  env.GIT_ASKPASS = "";
  env.SSH_ASKPASS = "";
  env.GCM_INTERACTIVE = "never";
  env.GIT_CONFIG_NOSYSTEM = "1";
  if (credentials?.token) {
    const user = credentials.username?.trim() || TOKEN_USER[provider];
    const basic = Buffer.from(`${user}:${credentials.token}`, "utf8").toString("base64");
    env.GIT_CONFIG_COUNT = "2";
    env.GIT_CONFIG_KEY_0 = scopeUrl ? `http.${scopeUrl}.extraHeader` : "http.extraHeader";
    env.GIT_CONFIG_VALUE_0 = `Authorization: Basic ${basic}`;
    env.GIT_CONFIG_KEY_1 = "credential.helper";
    env.GIT_CONFIG_VALUE_1 = "";
  }
  return env;
}

export function scrub(text: string, credentials: GitCredentials | null): string {
  if (!credentials?.token) return text;
  const users = new Set([credentials.username?.trim() ?? "", ...Object.values(TOKEN_USER)]);
  let out = text.split(credentials.token).join("[redacted]");
  for (const name of users) out = out.split(Buffer.from(`${name}:${credentials.token}`, "utf8").toString("base64")).join("[redacted]");
  return out.replace(/Authorization: Basic [A-Za-z0-9+/=]+/g, "Authorization: Basic [redacted]");
}

export type GitRunner = (args: string[], options: { cwd: string; env: NodeJS.ProcessEnv; timeoutMs: number }) => Promise<void>;

export const spawnGit: GitRunner = (args, options) =>
  new Promise((resolve, reject) => {
    const child = spawn("git", args, { cwd: options.cwd, env: options.env, shell: false, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const keep = (chunk: Buffer) => {
      output = (output + chunk.toString("utf8")).slice(-8000);
    };
    child.stdout.on("data", keep);
    child.stderr.on("data", keep);
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("git_timed_out"));
    }, options.timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject((error as NodeJS.ErrnoException).code === "ENOENT" ? new Error("git_not_installed") : error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(output.trim() || `git_failed_with_code_${code}`));
    });
  });

/* The reasons a person can act on, from git's output. */
export function explainGitFailure(message: string): string {
  if (/git_timed_out/.test(message)) return "repository_clone_timed_out";
  if (/git_not_installed/.test(message)) return "git_not_installed";
  if (/Authentication failed|could not read Username|terminal prompts disabled|HTTP Basic: Access denied|returned error: 40[13]/i.test(message)) return "repository_access_denied_check_url_or_token";
  if (/not found|does not exist|returned error: 404/i.test(message)) return "repository_not_found_or_private";
  if (/Could not resolve host|Failed to connect|Connection refused|timed out/i.test(message)) return "repository_host_unreachable";
  if (/Not possible to fast-forward|diverging/i.test(message)) return "local_copy_has_diverged_from_remote";
  return "repository_clone_failed";
}

export async function runGit(
  args: string[],
  options: { cwd: string; provider: GitProvider; credentials: GitCredentials | null; scopeUrl?: string; runner?: GitRunner; timeoutMs?: number },
): Promise<void> {
  const runner = options.runner ?? spawnGit;
  try {
    await runner(args, {
      cwd: options.cwd,
      env: gitEnvironment(options.provider, options.credentials, process.env, options.scopeUrl),
      timeoutMs: options.timeoutMs ?? DEFAULT_GIT_TIMEOUT_MS,
    });
  } catch (error) {
    const detail = scrub(error instanceof Error ? error.message : String(error), options.credentials);
    let reason = explainGitFailure(detail);
    /* Hosts answer "who are you?" for private and missing repositories alike. */
    if (reason === "repository_access_denied_check_url_or_token" && !options.credentials?.token) {
      reason = "repository_not_found_or_private_add_access_token";
    }
    const failure = new Error(reason);
    (failure as Error & { detail?: string }).detail = detail;
    throw failure;
  }
}
