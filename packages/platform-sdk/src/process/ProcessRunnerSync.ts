import {
  spawnSync,
  type SpawnSyncOptions,
} from "node:child_process";

export function runCommandSync(
  command: string,
  args: string[],
  options: SpawnSyncOptions,
): void {
  const result = spawnSync(
    command,
    args,
    options,
  );

  if (result.error) {
    throw new Error(
      result.error.message,
    );
  }

  if (result.signal) {
    throw new Error(
      `process_terminated:${result.signal}`,
    );
  }

  if (result.status !== 0) {
    throw new Error(
      `process_exit_code:${result.status}`,
    );
  }
}
