import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import {
  assertSafeProjectId,
  resolveProjectPath,
} from "@korelumina/platform-sdk";


import { detectFramework } from "../detect/detectFramework.js";
import { setProjectMetadata } from "../projects/projectMetadataStore.js";
import { getProjectsRoot } from "../projects/workspacePaths.js";

import {
  recordImportKnowledge,
} from "../knowledge/index.js";


type ValidatedRepo = {
  repoUrl: string;
  owner: string;
  repo: string;
};

type ImportAction =
  | "cloned"
  | "pulled";

export type ImportedGithubProject = {
  ok: true;
  action: ImportAction;
  projectId: string;
  projectPath: string;
  framework: ReturnType<typeof detectFramework>;
  repo: ValidatedRepo;
};

function normalizeProjectId(
  value: string,
) {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function validateGithubRepoUrl(
  repoUrl: unknown,
): ValidatedRepo {
  const value =
    typeof repoUrl === "string"
      ? repoUrl.trim()
      : "";

  if (!value) {
    throw new Error("missing_repoUrl");
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("invalid_repoUrl");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("only_https_repo_urls_supported");
  }

  if (parsed.hostname !== "github.com") {
    throw new Error("only_github_repositories_supported");
  }

  const parts =
    parsed.pathname
      .replace(/^\/+|\/+$/g, "")
      .replace(/\.git$/, "")
      .split("/")
      .filter(Boolean);

  if (parts.length < 2) {
    throw new Error("github_url_must_include_owner_and_repo");
  }

  return {
    repoUrl:
      `https://github.com/${parts[0]}/${parts[1]}.git`,
    owner: parts[0],
    repo: parts[1],
  };
}

function runCommand(
  command: string,
  args: string[],
  options: {
    cwd: string;
  },
) {
  return new Promise<void>(
    (resolve, reject) => {
      const proc =
        spawn(
          command,
          args,
          {
            cwd: options.cwd,
            shell: false,
            stdio: [
              "ignore",
              "pipe",
              "pipe",
            ],
          },
        );

      let stdout = "";
      let stderr = "";

      proc.stdout.on(
        "data",
        (data) => {
          stdout += data.toString();
        },
      );

      proc.stderr.on(
        "data",
        (data) => {
          stderr += data.toString();
        },
      );

      proc.on(
        "error",
        reject,
      );

      proc.on(
        "close",
        (code) => {
          if (code !== 0) {
            reject(
              new Error(
                stderr ||
                  stdout ||
                  `${command} failed with code ${code}`,
              ),
            );
            return;
          }

          resolve();
        },
      );
    },
  );
}

export async function importGithubProject(
  input: {
    repoUrl: unknown;
    projectId?: unknown;
    ownerId?: unknown;
    teamId?: unknown;
    createdBy?: unknown;
    visibility?: unknown;
  },
): Promise<ImportedGithubProject> {
  const repo =
    validateGithubRepoUrl(
      input.repoUrl,
    );

  const projectId =
    typeof input.projectId === "string" &&
    input.projectId.trim()
      ? normalizeProjectId(input.projectId)
      : normalizeProjectId(
          `${repo.owner}-${repo.repo}`,
        );

  const projectPath =
    resolveProjectPath(
      projectId,
    );


  const projectsRoot =
    getProjectsRoot();

  fs.mkdirSync(
    projectsRoot,
    {
      recursive: true,
    },
  );

  let action: ImportAction =
    "cloned";

  if (
    fs.existsSync(projectPath) &&
    fs.existsSync(
      path.join(
        projectPath,
        ".git",
      ),
    )
  ) {
    await runCommand(
      "git",
      [
        "pull",
        "--ff-only",
      ],
      {
        cwd: projectPath,
      },
    );

    action = "pulled";
  } else {
    if (
      fs.existsSync(projectPath) &&
      fs.readdirSync(projectPath).length > 0
    ) {
      throw new Error(
        "target_project_folder_exists_and_is_not_git_repo",
      );
    }

    await runCommand(
      "git",
      [
        "clone",
        "--depth",
        "1",
        repo.repoUrl,
        projectPath,
      ],
      {
        cwd: projectsRoot,
      },
    );
  }

  const framework =
    detectFramework(
      projectPath,
    );

  setProjectMetadata({
    projectId,

    ownerId:
      typeof input.ownerId === "string"
        ? input.ownerId
        : undefined,

    teamId:
      typeof input.teamId === "string"
        ? input.teamId
        : undefined,

    createdBy:
      typeof input.createdBy === "string"
        ? input.createdBy
        : undefined,

    visibility:
      input.visibility === "team" ||
      input.visibility === "support"
        ? input.visibility
        : "private",

    framework,

    sourceUrl:
      repo.repoUrl,

    repoOwner:
      repo.owner,

    repoName:
      repo.repo,
  });

  try {
    await recordImportKnowledge({
      projectId,
      projectPath,
      repositoryId:
        `github:${repo.owner}/${repo.repo}`.toLowerCase(),
      repoUrl:
        repo.repoUrl,
      owner:
        repo.owner,
      repo:
        repo.repo,
      framework,
    });
  } catch (error) {
    console.error(
      "[knowledge] import recording failed",
      error,
    );
  }

  return {
    ok: true,
    action,
    projectId,
    projectPath,
    framework,
    repo,
  };
}
