import fs from "node:fs";
import path from "node:path";

export interface WalkDirectoryOptions {
  skipDirectories?: Iterable<string>;
  relative?: boolean;
  include?: (filePath: string) => boolean;
  onError?: (
    error: unknown,
    directory: string,
  ) => void;
}

export function walkDirectory(
  root: string,
  options: WalkDirectoryOptions = {},
): string[] {
  const files: string[] = [];
  const skipDirectories = new Set(
    options.skipDirectories ?? [],
  );

  function returnedPath(
    filePath: string,
  ): string {
    if (!options.relative) {
      return filePath;
    }

    return path
      .relative(root, filePath)
      .replace(/\\/g, "/");
  }

  function walk(dir: string) {
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(
        dir,
        {
          withFileTypes: true,
        },
      );
    } catch (error) {
      options.onError?.(
        error,
        dir,
      );
      return;
    }

    for (const entry of entries) {
      const full = path.join(
        dir,
        entry.name,
      );

      if (entry.isDirectory()) {
        if (
          skipDirectories.has(
            entry.name,
          )
        ) {
          continue;
        }

        walk(full);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const filePath =
        returnedPath(full);

      if (
        options.include &&
        !options.include(filePath)
      ) {
        continue;
      }

      files.push(filePath);
    }
  }

  walk(root);

  return files.sort();
}
