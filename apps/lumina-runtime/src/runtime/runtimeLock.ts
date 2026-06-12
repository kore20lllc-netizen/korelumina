import fs from "node:fs";
import path from "node:path";

const LOCK_DIR = path.resolve(
  process.cwd(),
  "runtime-locks",
);

function ensureLockDir() {
  fs.mkdirSync(LOCK_DIR, {
    recursive: true,
  });
}

function validateProjectId(projectId: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(projectId)) {
    throw new Error("invalid_projectId");
  }
}

function lockPath(projectId: string) {
  ensureLockDir();

  validateProjectId(projectId);

  return path.join(
    LOCK_DIR,
    `${projectId}.lock`,
  );
}

export function acquireRuntimeLock(
  projectId: string,
  pid: number,
) {
  const file =
    lockPath(projectId);

  const payload = {
    projectId,
    pid,
    createdAt: Date.now(),
  };

  fs.writeFileSync(
    file,
    JSON.stringify(payload, null, 2),
    "utf8",
  );
}

export function releaseRuntimeLock(
  projectId: string,
) {
  const file =
    lockPath(projectId);

  if (
    fs.existsSync(file)
  ) {
    fs.unlinkSync(file);
  }
}

export function getRuntimeLock(
  projectId: string,
): {
  pid: number;
} | null {
  const file =
    lockPath(projectId);

  if (
    !fs.existsSync(file)
  ) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(
        fs.readFileSync(
          file,
          "utf8",
        ),
      );

    return {
      pid:
        Number(
          parsed.pid,
        ) || 0,
    };
  } catch {
    fs.unlinkSync(file);

    return null;
  }
}
