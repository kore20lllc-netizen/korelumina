import fs from "fs";
import path from "path";
import { runCompileGuard } from "./compile-guard";

export async function applyFiles({
  projectRoot,
  files,
}: {
  projectRoot: string;
  files: { path: string; content: string }[];
}) {

  for (const f of files) {
    const abs = path.join(projectRoot, f.path);

    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, f.content, "utf8");
  }

  const result = await runCompileGuard(projectRoot);

  // trigger UI refresh signal
  (process as any).emit("builder:file-change");

  return result;
}
