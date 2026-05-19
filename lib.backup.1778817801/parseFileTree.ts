export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

/**
 * Accept either:
 * - a single FileNode (root node)
 * - an array of FileNode objects
 *
 * This avoids TypeScript errors when different parts of the codebase
 * pass either shape.
 */
export function getFilePathsFromTree(
  tree: FileNode | FileNode[] | null | undefined,
): string[] {
  if (!tree) return [];

  const nodes = Array.isArray(tree) ? tree : [tree];
  const results: string[] = [];

  function walk(node: FileNode) {
    if (node.type === "file") {
      results.push(node.path);
    }

    if (node.children?.length) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  for (const node of nodes) {
    walk(node);
  }

  return results.sort();
}

/**
 * Converts a flat list of file paths into a tree.
 */
export function buildFileTree(
  paths: string[],
): FileNode[] {
  const root: FileNode[] = [];

  for (const filePath of paths) {
    const parts = filePath.split("/");
    let current = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath
        ? `${currentPath}/${part}`
        : part;

      const isFile = index === parts.length - 1;

      let existing = current.find(
        (node) => node.name === part,
      );

      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "directory",
          children: isFile ? undefined : [],
        };

        current.push(existing);
      }

      if (
        existing.type === "directory" &&
        existing.children
      ) {
        current = existing.children;
      }
    });
  }

  return root;
}
