import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  connectRuntimeEvents,
  type RuntimeEvent,
} from "@/services/runtimeService";

import {
  getActiveRuntime,
  getRuntimeStatus,
  isRuntimeManuallyStopped,
  startRuntime,
  type RuntimeSession,
} from "@/services/runtimeService";

export type RuntimeBootPhase =
  | "idle"
  | "discovering"
  | "starting"
  | "waiting-port"
  | "running"
  | "rebuilding"
  | "error";

interface RuntimeBootState {
  runtimeUrl: string;
  runtimeLoading: boolean;
  runtimeError: string | null;
  runtimeProjectId: string | null;
  runtime: RuntimeSession | null;
  runtimeHealthy: boolean;
  reconnecting: boolean;
  runtimePhase: RuntimeBootPhase;
  runtimeMessage: string;
  runtimeProgress: number;
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

function forgetRuntime(
  projectId?: string | null,
) {
  const remembered =
    localStorage.getItem(
      "lumina:last-runtime-project",
    );

  if (
    !projectId ||
    remembered === projectId
  ) {
    localStorage.removeItem(
      "lumina:last-runtime-project",
    );
  }

  if (projectId) {
    runtimeStartCache.delete(
      projectId,
    );
  }
}


function isValidProjectId(
  projectId?: string | null,
) {
  if (!projectId) {
    return false;
  }

  return !/^\d+$/.test(
    projectId,
  );
}

function phaseForStatus(
  status?: string | null,
): RuntimeBootPhase {
  if (status === "running") {
    return "running";
  }

  if (
    status === "starting" ||
    status === "pending"
  ) {
    return "waiting-port";
  }

  if (
    status === "restarting" ||
    status === "rebuilding"
  ) {
    return "rebuilding";
  }

  if (
    status === "error" ||
    status === "exited"
  ) {
    return "error";
  }

  return "discovering";
}

function messageForPhase(
  phase: RuntimeBootPhase,
  projectId?: string | null,
) {
  if (phase === "idle") {
    return "Select a project to start preview.";
  }

  if (phase === "discovering") {
    return projectId
      ? `Detecting runtime for ${projectId}...`
      : "Detecting active runtime...";
  }

  if (phase === "starting") {
    return "Launching development server...";
  }

  if (phase === "waiting-port") {
    return "Waiting for preview server...";
  }

  if (phase === "running") {
    return "Preview ready.";
  }

  if (phase === "rebuilding") {
    return "Refreshing application...";
  }

  return "Runtime failed to start.";
}

function progressForPhase(
  phase: RuntimeBootPhase,
) {
  if (phase === "idle") return 0;
  if (phase === "discovering") return 15;
  if (phase === "starting") return 40;
  if (phase === "waiting-port") return 72;
  if (phase === "rebuilding") return 82;
  if (phase === "running") return 100;
  return 100;
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

  const [
    runtimePhase,
    setRuntimePhase,
  ] = useState<RuntimeBootPhase>(
    "idle",
  );

  const runtimePhaseRef =
    useRef<RuntimeBootPhase>(
      "idle",
    );

  const [
    runtimeMessage,
    setRuntimeMessage,
  ] = useState(
    messageForPhase("idle"),
  );

  const [
    runtimeProgress,
    setRuntimeProgress,
  ] = useState(0);

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

  const manualStopGenerationRef =
    useRef(0);

  function setPhase(
    phase: RuntimeBootPhase,
    projectId?: string | null,
    message?: string,
  ) {
    runtimePhaseRef.current =
      phase;

    setRuntimePhase(phase);
    setRuntimeMessage(
      message ??
        messageForPhase(
          phase,
          projectId,
        ),
    );
    setRuntimeProgress(
      progressForPhase(
        phase,
      ),
    );
  }

  async function resolveRuntime(
    projectId: string,
  ) {
    if (
      isRuntimeManuallyStopped(
        projectId,
      )
    ) {
      lastResolvedKey.current =
        projectId;

      setRuntimeUrl("");
      setRuntimeProjectId(projectId);
      setRuntime(null);
      setRuntimeHealthy(false);
      setReconnecting(false);
      setRuntimeError(null);
      setRuntimeLoading(false);
      setPhase(
        "idle",
        projectId,
        "Runtime stopped. Use Start to launch preview.",
      );

      return;
    }

    const stopGeneration =
      manualStopGenerationRef.current;

    try {
      setRuntimeLoading(true);
      setRuntimeError(null);
      setPhase(
        "discovering",
        projectId,
      );

      const existing =
        await getRuntimeStatus(
          projectId,
        );

      if (
        existing?.url &&
        existing.status === "running"
      ) {
        if (!mountedRef.current) {
          return;
        }

        rememberRuntime(
          existing,
        );

        lastResolvedKey.current =
          projectId;

        setRuntime(existing);
        setRuntimeProjectId(
          existing.projectId,
        );
        setRuntimeUrl(existing.url);
        setRuntimeHealthy(true);
        setReconnecting(false);
        setPhase(
          "running",
          projectId,
        );

        return;
      }

      if (!mountedRef.current) {
        return;
      }

      if (
        stopGeneration !==
          manualStopGenerationRef.current ||
        isRuntimeManuallyStopped(projectId)
      ) {
        setRuntimeUrl("");
        setRuntimeProjectId(projectId);
        setRuntime(null);
        setRuntimeHealthy(false);
        setReconnecting(false);
        setRuntimeError(null);
        setPhase(
          "idle",
          projectId,
          isValidProjectId(projectId)
            ? "Runtime stopped. Use Start to launch preview."
            : "Select a project to start preview.",
        );

        return;
      }

      setPhase(
        "starting",
        projectId,
      );

      const started =
        await getOrStartRuntime(
          projectId,
        );

      if (
        !mountedRef.current
      ) {
        return;
      }

      if (
        stopGeneration !==
          manualStopGenerationRef.current ||
        isRuntimeManuallyStopped(projectId)
      ) {
        setRuntimeUrl("");
        setRuntimeProjectId(projectId);
        setRuntime(null);
        setRuntimeHealthy(false);
        setReconnecting(false);
        setRuntimeError(null);
        setPhase(
          "idle",
          projectId,
          isValidProjectId(projectId)
            ? "Runtime stopped. Use Start to launch preview."
            : "Select a project to start preview.",
        );

        return;
      }

      rememberRuntime(
        started,
      );

      lastResolvedKey.current =
        projectId;

      setRuntime(started);
      setRuntimeProjectId(
        started.projectId,
      );
      setRuntimeUrl(started.url);
      setRuntimeHealthy(
        started.status === "running",
      );
      setReconnecting(
        started.status !== "running",
      );
      setRuntimeError(null);
      setPhase(
        started.status === "running"
          ? "running"
          : phaseForStatus(started.status),
        projectId,
      );
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "failed_to_start_runtime";

      forgetRuntime(projectId);

      lastResolvedKey.current =
        null;

      setRuntimeUrl("");
      setRuntimeProjectId(null);
      setRuntime(null);
      setRuntimeHealthy(false);
      setReconnecting(false);
      setRuntimeError(message);
      setPhase(
        "error",
        projectId,
        message,
      );
    } finally {
      if (mountedRef.current) {
        setRuntimeLoading(false);
      }
    }
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
    function handleManualStop(
      event: Event,
    ) {
      const detail =
        (event as CustomEvent<{
          projectId?: string;
        }>).detail;

      if (
        !incomingProjectId ||
        detail?.projectId !== incomingProjectId
      ) {
        return;
      }

      manualStopGenerationRef.current += 1;

      forgetRuntime(
        incomingProjectId,
      );

      runtimeStartCache.delete(
        incomingProjectId,
      );

      lastResolvedKey.current =
        incomingProjectId;

      setRuntimeUrl("");
      setRuntimeLoading(false);
      setRuntimeError(null);
      setRuntimeProjectId(
        incomingProjectId,
      );
      setRuntime(null);
      setRuntimeHealthy(false);
      setReconnecting(false);
      setPhase(
        "idle",
        incomingProjectId,
        "Runtime stopped. Use Start to launch preview.",
      );
    }

    window.addEventListener(
      "lumina:runtime-stopped",
      handleManualStop,
    );

    return () => {
      window.removeEventListener(
        "lumina:runtime-stopped",
        handleManualStop,
      );
    };
  }, [incomingProjectId]);

  useEffect(() => {
    if (!incomingProjectId) {
      if (heartbeatRef.current) {
        window.clearInterval(
          heartbeatRef.current,
        );

        heartbeatRef.current =
          null;
      }

      lastResolvedKey.current =
        null;

      forgetRuntime(null);

      setRuntimeUrl("");
      setRuntimeLoading(false);
      setRuntimeError(null);
      setRuntimeProjectId(null);
      setRuntime(null);
      setRuntimeHealthy(false);
      setReconnecting(false);
      setPhase("idle");

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
            setRuntimeHealthy(false);
            setRuntimeError(event.error);
            setReconnecting(true);
            setPhase(
              "error",
              incomingProjectId,
              event.error,
            );

            return;
          }

          if (
            event.type ===
            "runtime:file-changed"
          ) {
            setReconnecting(true);
            setPhase(
              "rebuilding",
              incomingProjectId,
            );

            return;
          }

          if (
            event.type ===
            "runtime:state"
          ) {
            const nextPhase =
              phaseForStatus(
                event.status,
              );

            const healthy =
              nextPhase === "running";

            setRuntimeHealthy(
              healthy,
            );

            setReconnecting(
              !healthy,
            );

            setPhase(
              healthy
                ? "running"
                : nextPhase,
              incomingProjectId,
            );

            if (healthy) {
              const latest =
                await getRuntimeStatus(
                  incomingProjectId,
                );

              if (
                latest?.url &&
                mountedRef.current
              ) {
                setRuntime(latest);
                setRuntimeUrl(
                  latest.url,
                );
                setRuntimeProjectId(
                  latest.projectId,
                );
              }
            }
          }
        },
        () => {
          setRuntimeHealthy(false);
          setReconnecting(true);
          setPhase(
            "rebuilding",
            incomingProjectId,
            "Runtime connection interrupted. Reconnecting...",
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
          setPhase(
            "discovering",
            null,
            "Looking for active runtime...",
          );

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

            const phase =
              phaseForStatus(
                activeRuntime.status,
              );

            const healthy =
              phase === "running";

            setRuntimeHealthy(
              healthy,
            );

            setPhase(
              healthy
                ? "running"
                : phase,
              activeRuntime.projectId,
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
          setPhase(
            "idle",
            null,
            "No active runtime.",
          );

          return;
        }

        if (
          isRuntimeManuallyStopped(
            incomingProjectId,
          )
        ) {
          lastResolvedKey.current =
            incomingProjectId;

          setRuntime(null);
          setRuntimeUrl("");
          setRuntimeProjectId(
            incomingProjectId,
          );
          setRuntimeHealthy(false);
          setReconnecting(false);
          setRuntimeError(null);
          setPhase(
            "idle",
            incomingProjectId,
            isValidProjectId(projectId)
            ? "Runtime stopped. Use Start to launch preview."
            : "Select a project to start preview.",
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

        const message =
          error instanceof Error
            ? error.message
            : "Runtime failed";

        setRuntime(null);
        setRuntimeUrl("");
        setRuntimeHealthy(false);
        setRuntimeProjectId(
          incomingProjectId ?? null,
        );
        setRuntimeError(message);
        setPhase(
          "error",
          incomingProjectId,
          message,
        );
      } finally {
        if (
          !cancelled
        ) {
          setRuntimeLoading(false);
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
      if (
        isRuntimeManuallyStopped(
          incomingProjectId,
        )
      ) {
        setRuntime(null);
        setRuntimeUrl("");
        setRuntimeProjectId(
          incomingProjectId,
        );
        setRuntimeHealthy(false);
        setReconnecting(false);
        setRuntimeError(null);
        setPhase(
          "idle",
          incomingProjectId,
          isValidProjectId(projectId)
            ? "Runtime stopped. Use Start to launch preview."
            : "Select a project to start preview.",
        );

        return;
      }

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
          setRuntime(null);
          setRuntimeUrl("");
          setRuntimeProjectId(
            incomingProjectId,
          );
          setRuntimeHealthy(false);
          setReconnecting(false);
          setRuntimeError(null);
          setPhase(
            "idle",
            incomingProjectId,
            isValidProjectId(projectId)
            ? "Runtime stopped. Use Start to launch preview."
            : "Select a project to start preview.",
          );

          return;
        }

        setRuntime(
          nextRuntime,
        );

        setRuntimeUrl(
          nextRuntime.url,
        );

        setRuntimeProjectId(
          nextRuntime.projectId,
        );

        const phase =
          phaseForStatus(
            nextRuntime.status,
          );

        const healthy =
          phase === "running";

        setRuntimeHealthy(
          healthy,
        );

        setReconnecting(
          !healthy,
        );

        setPhase(
          healthy
            ? "running"
            : phase,
          incomingProjectId,
        );
      } catch {
        if (
          mountedRef.current
        ) {
          setRuntimeHealthy(false);
          setReconnecting(true);
          setPhase(
            "waiting-port",
            incomingProjectId,
            "Waiting for runtime service...",
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
    runtimePhase,
    runtimeMessage,
    runtimeProgress,
  };
}
