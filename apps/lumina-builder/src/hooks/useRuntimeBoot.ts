import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  connectRuntimeEvents,
  type RuntimeEvent,
} from "@/services/runtimeEvents";

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
  runtimeHealthy: boolean;
  reconnecting: boolean;
}

const runtimeStartCache =
  new Map<
    string,
    Promise<RuntimeSession>
  >();

const HEARTBEAT_INTERVAL_MS =
  5000;

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

  if (
    existing?.url &&
    existing.status === "running"
  ) {
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

  const [
    runtimeHealthy,
    setRuntimeHealthy,
  ] = useState(false);

  const [
    reconnecting,
    setReconnecting,
  ] = useState(false);

  const heartbeatRef =
    useRef<number | null>(
      null,
    );

  const mountedRef =
    useRef(true);

  const lastResolvedKey =
    useRef<string | null>(
      null,
    );

  async function resolveRuntime(
    projectId: string,
  ) {
    const nextRuntime =
      await getOrStartRuntime(
        projectId,
      );

    if (!mountedRef.current) {
      return;
    }

    lastResolvedKey.current =
      projectId;

    setRuntime(
      nextRuntime,
    );

    setRuntimeProjectId(
      nextRuntime.projectId,
    );

    setRuntimeUrl(
      nextRuntime.url,
    );

    setRuntimeHealthy(
      nextRuntime.status ===
        "running",
    );

    setRuntimeError(null);
  }

  useEffect(() => {
    mountedRef.current =
      true;

    return () => {
      mountedRef.current =
        false;
    };
  }, []);

  useEffect(() => {
    if (!incomingProjectId) {
      return;
    }

    const disconnect =
      connectRuntimeEvents(
        async (
          event: RuntimeEvent,
        ) => {
          if (
            event.projectId !==
            incomingProjectId
          ) {
            return;
          }

          if (
            event.type ===
            "runtime:error"
          ) {
            setRuntimeHealthy(
              false,
            );

            setRuntimeError(
              event.error,
            );

            setReconnecting(
              true,
            );

            try {
              await resolveRuntime(
                incomingProjectId,
              );
            } finally {
              setReconnecting(
                false,
              );
            }

            return;
          }

          if (
            event.type ===
            "runtime:state"
          ) {
            const healthy =
              event.status ===
              "running";

            setRuntimeHealthy(
              healthy,
            );

            if (!healthy) {
              setReconnecting(
                true,
              );
            }

            if (
              healthy
            ) {
              setReconnecting(
                false,
              );

              const latest =
                await getRuntimeStatus(
                  incomingProjectId,
                );

              if (
                latest?.url
              ) {
                setRuntime(
                  latest,
                );

                setRuntimeUrl(
                  latest.url,
                );
              }
            }
          }
        },
        () => {
          setRuntimeHealthy(
            false,
          );
        },
      );

    return () => {
      disconnect();
    };
  }, [incomingProjectId]);

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

          if (
            cancelled ||
            !mountedRef.current
          ) {
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

            setRuntimeHealthy(
              activeRuntime.status ===
                "running",
            );

            return;
          }

          setRuntime(null);
          setRuntimeProjectId(null);
          setRuntimeUrl("");
          setRuntimeHealthy(false);

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

        await resolveRuntime(
          incomingProjectId,
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

        setRuntimeHealthy(
          false,
        );

        setRuntimeProjectId(
          incomingProjectId ?? null,
        );

        setRuntimeError(
          error instanceof Error
            ? error.message
            : "Runtime failed",
        );
      } finally {
        if (
          !cancelled
        ) {
          setRuntimeLoading(
            false,
          );
        }
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [incomingProjectId]);

  useEffect(() => {
    if (
      !incomingProjectId
    ) {
      return;
    }

    async function heartbeat() {
      try {
        const nextRuntime =
          await getRuntimeStatus(
            incomingProjectId,
          );

        if (
          !mountedRef.current
        ) {
          return;
        }

        if (
          !nextRuntime
        ) {
          setRuntimeHealthy(
            false,
          );

          setReconnecting(
            true,
          );

          return;
        }

        setRuntime(
          nextRuntime,
        );

        setRuntimeUrl(
          nextRuntime.url,
        );

        setRuntimeHealthy(
          nextRuntime.status ===
            "running",
        );

        if (
          nextRuntime.status ===
          "running"
        ) {
          setReconnecting(
            false,
          );
        }
      } catch {
        if (
          mountedRef.current
        ) {
          setRuntimeHealthy(
            false,
          );
        }
      }
    }

    heartbeat();

    heartbeatRef.current =
      window.setInterval(
        heartbeat,
        HEARTBEAT_INTERVAL_MS,
      );

    return () => {
      if (
        heartbeatRef.current
      ) {
        window.clearInterval(
          heartbeatRef.current,
        );
      }
    };
  }, [incomingProjectId]);

  return {
    runtimeUrl,
    runtimeLoading,
    runtimeError,
    runtimeProjectId,
    runtime,
    runtimeHealthy,
    reconnecting,
  };
}
