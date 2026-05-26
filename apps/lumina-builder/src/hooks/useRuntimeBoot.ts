import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getActiveRuntime,
  getRuntimeStatus,
  startRuntime,
  type RuntimeSession,
} from "@/services/runtimeService";

interface RuntimeBootState {
  runtimeUrl: string;
  runtimeLoading: boolean;
  runtimeError: string | null;
  runtimeProjectId: string | null;
  runtime: RuntimeSession | null;
}

const runtimeStartCache =
  new Map<
    string,
    Promise<RuntimeSession>
  >();

function rememberRuntime(
  runtime: RuntimeSession,
) {
  localStorage.setItem(
    "lumina:last-runtime-project",
    runtime.projectId,
  );
}

async function getOrStartRuntime(
  projectId: string,
) {
  const existing =
    await getRuntimeStatus(
      projectId,
    );

  if (existing?.url) {
    rememberRuntime(
      existing,
    );

    return existing;
  }

  const cached =
    runtimeStartCache.get(
      projectId,
    );

  if (cached) {
    return cached;
  }

  const promise =
    startRuntime(projectId)
      .then((runtime) => {
        rememberRuntime(
          runtime,
        );

        return runtime;
      })
      .finally(() => {
        runtimeStartCache.delete(
          projectId,
        );
      });

  runtimeStartCache.set(
    projectId,
    promise,
  );

  return promise;
}

export function useRuntimeBoot(
  incomingProjectId?: string | null,
): RuntimeBootState {
  const [
    runtimeUrl,
    setRuntimeUrl,
  ] = useState("");

  const [
    runtimeLoading,
    setRuntimeLoading,
  ] = useState(false);

  const [
    runtimeError,
    setRuntimeError,
  ] = useState<string | null>(
    null,
  );

  const [
    runtimeProjectId,
    setRuntimeProjectId,
  ] = useState<string | null>(
    null,
  );

  const [
    runtime,
    setRuntime,
  ] = useState<RuntimeSession | null>(
    null,
  );

  const lastResolvedKey =
    useRef<string | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        setRuntimeLoading(true);
        setRuntimeError(null);

        if (
          !incomingProjectId
        ) {
          const activeRuntime =
            await getActiveRuntime();

          if (cancelled) {
            return;
          }

          if (
            activeRuntime?.url
          ) {
            lastResolvedKey.current =
              activeRuntime.projectId;

            setRuntime(
              activeRuntime,
            );

            setRuntimeProjectId(
              activeRuntime.projectId,
            );

            setRuntimeUrl(
              activeRuntime.url,
            );

            return;
          }

          setRuntime(null);
          setRuntimeProjectId(null);
          setRuntimeUrl("");
          setRuntimeError(
            "No active runtime",
          );

          return;
        }

        if (
          lastResolvedKey.current ===
            incomingProjectId &&
          runtimeUrl
        ) {
          return;
        }

        const nextRuntime =
          await getOrStartRuntime(
            incomingProjectId,
          );

        if (cancelled) {
          return;
        }

        lastResolvedKey.current =
          incomingProjectId;

        setRuntime(
          nextRuntime,
        );

        setRuntimeProjectId(
          nextRuntime.projectId,
        );

        setRuntimeUrl(
          nextRuntime.url,
        );
      } catch (error) {
        console.error(
          "[runtime boot failed]",
          error,
        );

        if (cancelled) {
          return;
        }

        setRuntime(null);
        setRuntimeUrl("");
        setRuntimeProjectId(
          incomingProjectId ?? null,
        );

        setRuntimeError(
          error instanceof Error
            ? error.message
            : "Runtime failed",
        );
      } finally {
        if (!cancelled) {
          setRuntimeLoading(false);
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [incomingProjectId]);

  return {
    runtimeUrl,
    runtimeLoading,
    runtimeError,
    runtimeProjectId,
    runtime,
  };
}
