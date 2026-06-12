const globalKey =
  "__lumina_runtime_bootstrap_started__";

type RuntimeGlobal =
  typeof globalThis & {
    [globalKey]?: boolean;
  };

export function claimRuntimeBootstrap() {
  const runtimeGlobal =
    globalThis as RuntimeGlobal;

  if (runtimeGlobal[globalKey]) {
    return false;
  }

  runtimeGlobal[globalKey] = true;

  return true;
}
