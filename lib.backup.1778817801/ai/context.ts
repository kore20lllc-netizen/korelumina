import fs from "fs";
import path from "path";

export type ProjectContext = {
  tree: string[];
  importantFiles: Record<string,string>;
};

function scan(dir: string, base: string, out: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(base, abs);

    if (rel.startsWith(".next")) continue;
    if (rel.startsWith("node_modules")) continue;
    if (rel.startsWith(".git")) continue;

    if (e.isDirectory()) {
      scan(abs, base, out);
    } else {
      out.push(rel);
    }
  }
}

export function buildProjectContext(projectRoot: string): ProjectContext {

  const tree: string[] = [];
  scan(projectRoot, projectRoot, tree);

  const important = [
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "next.config.ts"
  ];

  const importantFiles: Record<string,string> = {};

  for (const f of important) {
    const p = path.join(projectRoot, f);
    if (fs.existsSync(p)) {
      importantFiles[f] = fs.readFileSync(p,"utf8").slice(0,4000);
    }
  }

  return {
    tree: tree.slice(0,200),
    importantFiles
  };
}
