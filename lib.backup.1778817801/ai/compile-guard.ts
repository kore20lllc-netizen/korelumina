import { spawn } from "child_process";

export type CompileGuardResult = {
  ok: boolean;
  output?: string;
};

/**
 * Compile guard for AI apply/repair flows.
 *
 * Backward-compatible signature:
 * - runCompileGuard(projectRoot)
 * - runCompileGuard(projectRoot, opts)
 *
 * opts may contain:
 * - cmd: string
 * - args: string[]
 *
 * Defaults to: npm run build
 */
export async function runCompileGuard(
  projectRoot: string,
  opts?: any
): Promise<CompileGuardResult> {
  const cmd: string = opts?.cmd ?? "npm";
  const args: string[] = opts?.args ?? ["run", "build"];

  return await new Promise<CompileGuardResult>((resolve) => {
    const child = spawn(cmd, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let out = "";

    child.stdout?.on("data", (chunk) => {
      out += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      out += chunk.toString();
    });

    child.on("close", (code) => {
      if (code === 0) resolve({ ok: true, output: out });
      else resolve({ ok: false, output: out });
    });

    child.on("error", (err) => {
      resolve({ ok: false, output: String((err as any)?.message ?? err) });
    });
  });
}
