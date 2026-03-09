import { exec } from "child_process";
import path from "path";

export interface CompileGuardResult {
  ok: boolean;
  output?: string;
}

export function runCompileGuard(projectRoot: string): Promise<CompileGuardResult> {
  return new Promise((resolve) => {
    const cmd = "npx tsc --noEmit";

    exec(
      cmd,
      {
        cwd: projectRoot,
        timeout: 20000,
        maxBuffer: 1024 * 1024
      },
      (error, stdout, stderr) => {
        if (error) {
          resolve({
            ok: false,
            output: stderr || stdout || error.message
          });
        } else {
          resolve({
            ok: true,
            output: stdout
          });
        }
      }
    );
  });
}
