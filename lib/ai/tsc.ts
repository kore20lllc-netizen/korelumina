import { spawnSync } from "child_process";

export function runTscNoEmit(projectRoot: string): { ok: boolean; output: string } {
  const res = spawnSync(
    "npx",
    ["-y", "tsc", "-p", "tsconfig.json", "--noEmit", "--pretty", "false"],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: process.env,
    }
  );

  const output = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim();

  // If spawn failed, treat as failure with message
  if (res.error) {
    return { ok: false, output: String((res.error as any).message ?? res.error) };
  }

  return { ok: res.status === 0, output };
}
