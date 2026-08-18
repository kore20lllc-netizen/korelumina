import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function resolveRepositoryRoot(): string {
  let current =
    process.cwd();

  for (
    let depth = 0;
    depth < 8;
    depth += 1
  ) {
    const packageJson =
      path.join(
        current,
        "package.json",
      );

    const runtimePackage =
      path.join(
        current,
        "apps",
        "lumina-runtime",
        "package.json",
      );

    if (
      fs.existsSync(
        packageJson,
      ) &&
      fs.existsSync(
        runtimePackage,
      )
    ) {
      return current;
    }

    const parent =
      path.dirname(
        current,
      );

    if (
      parent === current
    ) {
      break;
    }

    current =
      parent;
  }

  throw new Error(
    "korelumina_repository_root_not_found",
  );
}

function isNodeTestProcess(): boolean {
  if (
    process.env.NODE_ENV ===
      "test" ||
    Boolean(
      process.env
        .NODE_TEST_CONTEXT,
    )
  ) {
    return true;
  }

  if (
    process.execArgv.some(
      (value) =>
        value === "--test" ||
        value.startsWith(
          "--test=",
        ),
    )
  ) {
    return true;
  }

  return process.argv.some(
    (value) =>
      value.includes(
        "__tests__",
      ) ||
      /\.test\.[cm]?[jt]sx?$/.test(
        value,
      ),
  );
}

export function resolveKnowledgeStorageRoot():
string {
  const explicit =
    process.env
      .KORELUMINA_KNOWLEDGE_ROOT
      ?.trim();

  if (explicit) {
    return path.resolve(
      explicit,
    );
  }

  const repositoryRoot =
    resolveRepositoryRoot();

  if (
    isNodeTestProcess()
  ) {
    return path.join(
      repositoryRoot,
      "runtime-data",
      "test-knowledge",
      String(
        process.pid,
      ),
    );
  }

  return path.join(
    repositoryRoot,
    "runtime",
    "knowledge",
  );
}

export function resolveKnowledgeStoragePath(
  ...segments:
    string[]
): string {
  return path.join(
    resolveKnowledgeStorageRoot(),
    ...segments,
  );
}

export function assertProductionKnowledgeStorageUnmodifiedByTests():
void {
  if (
    !isNodeTestProcess()
  ) {
    return;
  }

  const resolved =
    resolveKnowledgeStorageRoot();

  const production =
    path.join(
      resolveRepositoryRoot(),
      "runtime",
      "knowledge",
    );

  if (
    path.resolve(
      resolved,
    ) ===
    path.resolve(
      production,
    )
  ) {
    throw new Error(
      "test_process_cannot_use_production_knowledge_storage",
    );
  }
}

assertProductionKnowledgeStorageUnmodifiedByTests();
