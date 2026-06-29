import { spawn } from "node:child_process";

export function runCommand(
  command: string,
  args: string[],
  options: {
    cwd: string;
  },
) {
  return new Promise<void>(
    (resolve, reject) => {
      const proc =
        spawn(
          command,
          args,
          {
            cwd: options.cwd,
            shell: false,
            stdio: [
              "ignore",
              "pipe",
              "pipe",
            ],
          },
        );

      let stdout = "";
      let stderr = "";

      proc.stdout.on(
        "data",
        (data) => {
          stdout += data.toString();
        },
      );

      proc.stderr.on(
        "data",
        (data) => {
          stderr += data.toString();
        },
      );

      proc.on(
        "error",
        reject,
      );

      proc.on(
        "close",
        (code) => {
          if (code !== 0) {
            reject(
              new Error(
                stderr ||
                  stdout ||
                  `${command} failed with code ${code}`,
              ),
            );
            return;
          }

          resolve();
        },
      );
    },
  );
}
