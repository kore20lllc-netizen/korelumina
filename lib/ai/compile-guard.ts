import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

export type CompileGuardResult = {
  ok: boolean;
  output?: string;
};

function run(args: string[], cwd: string) {
  const res = spawnSync("npx", ["-y", "tsc", ...args], {
    cwd,
    env: process.env,
    encoding: "utf8",
  });

  const out = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim();

  if (res.error) {
    return { ok: false, out: String(res.error.message ?? res.error) };
  }

  return { ok: res.status === 0, out };
}

function toRel(projectRoot: string, p: string): string {
  const abs = path.isAbsolute(p) ? p : path.join(projectRoot, p);
  return path.relative(projectRoot, abs).replace(/\\/g, "/");
}

export function runCompileGuard(projectRoot: string, touched: string[]): CompileGuardResult {
  const relFiles = (touched ?? [])
    .filter(Boolean)
    .map(p => toRel(projectRoot, p))
    .filter(p => !p.startsWith("../"))
    .filter(p => /\.(ts|tsx)$/.test(p));

  if (fs.existsSync(path.join(projectRoot, "tsconfig.json"))) {
    const projectCheck = run(
      ["-p", "tsconfig.json", "--noEmit", "--pretty", "false"],
      projectRoot
    );

    if (!projectCheck.ok) {
      return { ok: false, output: projectCheck.out };
    }
  }

  if (relFiles.length > 0) {
    const strictCheck = run(
      [
        "--noEmit",
        "--pretty", "false",
        "--strict",
        "--skipLibCheck", "false",
        "--isolatedModules", "false",
        ...relFiles,
      ],
      projectRoot
    );

    if (!strictCheck.ok) {
      return { ok: false, output: strictCheck.out };
    }
  }

  return { ok: true };
}
