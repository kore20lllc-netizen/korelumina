import fs from "node:fs";
import path from "node:path";

import {
  detectFramework,
} from "../../detect/detectFramework.js";

import type {
  RepositoryManifest,
} from "./RepositoryManifest.js";

const ROOT_FILES = [
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "tsconfig.json",
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
];

export function analyzeRepository(
  projectId: string,
  projectPath: string,
): RepositoryManifest {
  const rootFiles =
    ROOT_FILES.filter((file) =>
      fs.existsSync(
        path.join(
          projectPath,
          file,
        ),
      ),
    );

  const languages =
    detectLanguages(projectPath);

  return {
    id: projectId,
    projectId,
    framework:
      detectFramework(
        projectPath,
      ),
    packageManager:
      detectPackageManager(
        rootFiles,
      ),
    languages,
    rootFiles,
    analyzedAt:
      Date.now(),
  };
}

function detectPackageManager(
  files: string[],
) {
  if (
    files.includes(
      "pnpm-lock.yaml",
    )
  ) {
    return "pnpm";
  }

  if (
    files.includes(
      "yarn.lock",
    )
  ) {
    return "yarn";
  }

  if (
    files.includes(
      "bun.lockb",
    )
  ) {
    return "bun";
  }

  return "npm";
}

function detectLanguages(
  projectPath: string,
): string[] {
  const languages =
    new Set<string>();

  walk(
    projectPath,
    languages,
  );

  return Array.from(
    languages,
  ).sort();
}

function walk(
  dir: string,
  languages: Set<string>,
) {
  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true,
  })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git"
    ) {
      continue;
    }

    const full =
      path.join(
        dir,
        entry.name,
      );

    if (
      entry.isDirectory()
    ) {
      walk(
        full,
        languages,
      );
      continue;
    }

    switch (
      path.extname(
        entry.name,
      )
    ) {
      case ".ts":
      case ".tsx":
        languages.add(
          "TypeScript",
        );
        break;

      case ".js":
      case ".jsx":
        languages.add(
          "JavaScript",
        );
        break;

      case ".json":
        languages.add(
          "JSON",
        );
        break;

      case ".css":
        languages.add(
          "CSS",
        );
        break;

      case ".md":
        languages.add(
          "Markdown",
        );
        break;
    }
  }
}
