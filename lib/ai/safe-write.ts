import fs from "fs";
import path from "path";
import { assertAllowedFile, assertInsideProject } from "@/lib/runtime/guardrails";

export function isValidCode(input: string) {
  if (!input) return false;
  const t = input.trim();

  if (
    t.startsWith("{") ||
    t.startsWith("[") ||
    t.startsWith("<!doctype") ||
    t.includes('"ok":')
  ) return false;

  return (
    t.includes("export default") ||
    t.includes("function") ||
    t.includes("React")
  );
}

export function safeWrite(projectRoot: string, relPath: string, content: string) {
  assertAllowedFile(relPath);

  const fullPath = assertInsideProject(projectRoot, relPath);

  if (!isValidCode(content)) {
    throw new Error("Invalid code detected — write blocked");
  }

  const backup = fullPath + ".bak";
  if (fs.existsSync(fullPath)) {
    fs.copyFileSync(fullPath, backup);
  }

  fs.writeFileSync(fullPath, content, "utf8");
}
