const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECTS_ROOT = path.join(
  process.cwd(),
  "runtime",
  "workspaces",
  "default",
  "projects",
);

function isSafeProjectId(projectId) {
  return /^[a-zA-Z0-9._-]+$/.test(projectId);
}

function normalizeProjectId(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function assertSafeProjectPath(projectId) {
  if (!projectId || !isSafeProjectId(projectId)) {
    throw new Error("Invalid projectId");
  }

  const projectPath = path.join(
    PROJECTS_ROOT,
    projectId,
  );

  const resolvedRoot =
    path.resolve(PROJECTS_ROOT);

  const resolvedProject =
    path.resolve(projectPath);

  if (
    !resolvedProject.startsWith(
      resolvedRoot + path.sep,
    )
  ) {
    throw new Error(
      "Unsafe project path",
    );
  }

  return projectPath;
}

function validateRepoUrl(repoUrl) {
  const value = String(repoUrl || "").trim();

  if (!value) {
    throw new Error("Missing repoUrl");
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Invalid repoUrl");
  }

  if (parsed.protocol !== "https:") {
    throw new Error(
      "Only HTTPS GitHub URLs are supported",
    );
  }

  if (parsed.hostname !== "github.com") {
    throw new Error(
      "Only github.com repositories are supported",
    );
  }

  const parts = parsed.pathname
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.git$/, "")
    .split("/");

  if (parts.length < 2) {
    throw new Error(
      "GitHub URL must include owner and repo",
    );
  }

  return {
    repoUrl:
      `https://github.com/${parts[0]}/${parts[1]}.git`,
    owner: parts[0],
    repo: parts[1],
  };
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      command,
      args,
      {
        ...options,
        shell: false,
      },
    );

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("error", reject);

    proc.on("close", (code) => {
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

      resolve({
        stdout,
        stderr,
      });
    });
  });
}

async function importRepo({
  repoUrl,
  projectId,
}) {
  const repo =
    validateRepoUrl(repoUrl);

  const finalProjectId =
    projectId
      ? normalizeProjectId(projectId)
      : normalizeProjectId(
          `${repo.owner}-${repo.repo}`,
        );

  const projectPath =
    assertSafeProjectPath(
      finalProjectId,
    );

  fs.mkdirSync(PROJECTS_ROOT, {
    recursive: true,
  });

  if (
    fs.existsSync(projectPath) &&
    fs.existsSync(
      path.join(projectPath, ".git"),
    )
  ) {
    await runCommand(
      "git",
      ["pull", "--ff-only"],
      {
        cwd: projectPath,
      },
    );

    return {
      ok: true,
      action: "pulled",
      projectId:
        finalProjectId,
      projectPath,
      repo,
    };
  }

  if (
    fs.existsSync(projectPath) &&
    fs.readdirSync(projectPath).length > 0
  ) {
    throw new Error(
      "Target project folder already exists and is not a git repo",
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
      cwd: PROJECTS_ROOT,
    },
  );

  return {
    ok: true,
    action: "cloned",
    projectId:
      finalProjectId,
    projectPath,
    repo,
  };
}

module.exports = {
  importRepo,
  normalizeProjectId,
  validateRepoUrl,
};
