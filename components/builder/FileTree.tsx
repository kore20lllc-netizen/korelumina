"use client";

import { useEffect, useState } from "react";

function buildTree(files: string[]) {
  const root: any = {};

  for (const file of files) {
    const parts = file.split("/");
    let node = root;

    for (const part of parts) {
      if (!node[part]) node[part] = {};
      node = node[part];
    }
  }

  return root;
}

function TreeNode({ node, path = "", onSelect }: any) {
  const [open, setOpen] = useState(false);

  return Object.keys(node).map((key) => {
    const fullPath = path ? `${path}/${key}` : key;
    const children = node[key];
    const isFile = Object.keys(children).length === 0;

    if (isFile) {
      return (
        <div
          key={fullPath}
          style={{ paddingLeft: 16, cursor: "pointer" }}
          onClick={() => onSelect(fullPath)}
        >
          {key}
        </div>
      );
    }

    return (
      <div key={fullPath}>
        <div
          style={{ cursor: "pointer", fontWeight: "bold" }}
          onClick={() => setOpen(!open)}
        >
          {open ? "▼" : "▶"} {key}
        </div>

        {open && (
          <div style={{ paddingLeft: 12 }}>
            <TreeNode node={children} path={fullPath} onSelect={onSelect} />
          </div>
        )}
      </div>
    );
  });
}

export default function FileTree({
  workspaceId,
  projectId,
  onSelect,
}: {
  workspaceId: string;
  projectId: string;
  onSelect: (path: string) => void;
}) {
  const [tree, setTree] = useState<any>({});

  async function load() {
    const res = await fetch(
      `/api/files?workspaceId=${workspaceId}&projectId=${projectId}`
    );

    const data = await res.json();
    setTree(buildTree(data.files || []));
  }

  useEffect(() => {
    load();

    const handler = () => load();

    window.addEventListener("builder:file-change", handler);

    return () => {
      window.removeEventListener("builder:file-change", handler);
    };
  }, [workspaceId, projectId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Files</h2>
      <TreeNode node={tree} onSelect={onSelect} />
    </div>
  );
}
