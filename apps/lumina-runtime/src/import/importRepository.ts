import fs from "node:fs";
import path from "node:path";

import { resolveProjectPath } from "@korelumina/platform-sdk";

import { detectFramework } from "../detect/detectFramework.js";
import { recordImportKnowledge } from "../knowledge/index.js";
import { setProjectMetadata } from "../projects/projectMetadataStore.js";
import { getProjectsRoot } from "../projects/workspacePaths.js";
import { runGit, type GitCredentials, type GitRunner } from "./GitClone.js";
import { parseRepositoryUrl, type RepositorySource } from "./RepositorySource.js";

/*
 * MS-2026-0013 (Import any repository): import from any git host over
 * HTTPS, public or private. A token for a private repository is used for
 * this import only and never stored; updating the copy later needs it
 * again.
 */

type ImportAction = "cloned" | "pulled";

export type ImportedRepository = {
  ok: true;
  action: ImportAction;
  projectId: string;
  projectPath: string;
  framework: ReturnType<typeof detectFramework>;
  repo: { repoUrl: string; owner: string; repo: string; provider: RepositorySource["provider"]; host: string };
};

function normalizeProjectId(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\.git$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function credentialsFrom(input: { accessToken?: unknown; accessUsername?: unknown }): GitCredentials | null {
  const token = typeof input.accessToken === "string" ? input.accessToken.trim() : "";
  if (!token) return null;
  if (/[\r\n]/.test(token)) throw new Error("invalid_access_token");
  const username = typeof input.accessUsername === "string" && input.accessUsername.trim() ? input.accessUsername.trim() : undefined;
  if (username && /[\r\n:]/.test(username)) throw new Error("invalid_access_username");
  return { token, username };
}

export async function importRepository(
  input: {
    repoUrl: unknown;
    accessToken?: unknown;
    accessUsername?: unknown;
    projectId?: unknown;
    ownerId?: unknown;
    teamId?: unknown;
    createdBy?: unknown;
    visibility?: unknown;
  },
  dependencies: { git?: GitRunner } = {},
): Promise<ImportedRepository> {
  const source = parseRepositoryUrl(input.repoUrl);
  const credentials = credentialsFrom(input);

  const projectId =
    typeof input.projectId === "string" && input.projectId.trim()
      ? normalizeProjectId(input.projectId)
      : normalizeProjectId(`${source.owner}-${source.repo}`);
  if (!projectId) throw new Error("invalid_projectId");

  const projectPath = resolveProjectPath(projectId);
  const projectsRoot = getProjectsRoot();
  fs.mkdirSync(projectsRoot, { recursive: true });

  const git = { provider: source.provider, credentials, scopeUrl: `https://${source.host}/`, runner: dependencies.git };
  let action: ImportAction = "cloned";
  if (fs.existsSync(projectPath) && fs.existsSync(path.join(projectPath, ".git"))) {
    await runGit(["pull", "--ff-only"], { cwd: projectPath, ...git });
    action = "pulled";
  } else {
    if (fs.existsSync(projectPath) && fs.readdirSync(projectPath).length > 0) {
      throw new Error("target_project_folder_exists_and_is_not_git_repo");
    }
    await runGit(["clone", "--depth", "1", "--no-tags", "--", source.cloneUrl, projectPath], { cwd: projectsRoot, ...git });
  }

  const framework = detectFramework(projectPath);

  setProjectMetadata({
    projectId,
    ownerId: typeof input.ownerId === "string" ? input.ownerId : undefined,
    teamId: typeof input.teamId === "string" ? input.teamId : undefined,
    createdBy: typeof input.createdBy === "string" ? input.createdBy : undefined,
    visibility: input.visibility === "team" || input.visibility === "support" ? input.visibility : "private",
    framework,
    sourceUrl: source.cloneUrl,
    repoOwner: source.owner,
    repoName: source.repo,
  });

  try {
    await recordImportKnowledge({
      projectId,
      projectPath,
      repositoryId: source.repositoryId,
      repoUrl: source.cloneUrl,
      owner: source.owner,
      repo: source.repo,
      framework,
    });
  } catch (error) {
    console.error("[knowledge] import recording failed", error);
  }

  return {
    ok: true,
    action,
    projectId,
    projectPath,
    framework,
    repo: { repoUrl: source.cloneUrl, owner: source.owner, repo: source.repo, provider: source.provider, host: source.host },
  };
}
