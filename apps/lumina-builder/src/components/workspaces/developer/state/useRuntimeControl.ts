import { useCallback, useEffect, useState } from "react";

import { useRuntimeBoot } from "@/hooks/useRuntimeBoot";
import { getRuntimeLogs, restartRuntime } from "@/services/runtimeService";

import { describeRuntimeError } from "../shared/fileTree";

/*
 * MS-2026-0011: the project's running dev server, as Runtime reports it.
 * Build used to open a dock and announce "Build started" while nothing
 * ran; the real actions are restarting the server and reading its logs.
 */

const LOG_POLL_MS = 2_000;

export function useRuntimeControl(projectId: string | null, logsVisible: boolean) {
  const boot = useRuntimeBoot(projectId);
  const [logs, setLogs] = useState<string[]>([]);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    setLogs([]);
    setLogsError(null);
    setRestartError(null);
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !logsVisible) return;
    let cancelled = false;
    const read = () =>
      getRuntimeLogs(projectId)
        .then((lines: unknown[]) => {
          if (cancelled) return;
          setLogs(lines.map(String));
          setLogsError(null);
        })
        .catch(() => !cancelled && setLogsError("Runtime did not return logs."));
    void read();
    const timer = window.setInterval(read, LOG_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [projectId, logsVisible]);

  const restart = useCallback(async () => {
    if (!projectId || restarting) return;
    setRestarting(true);
    setRestartError(null);
    try {
      await restartRuntime(projectId);
      setPreviewKey((key) => key + 1);
    } catch (error) {
      setRestartError(describeRuntimeError(error instanceof Error ? error.message : "failed_to_restart"));
    } finally {
      setRestarting(false);
    }
  }, [projectId, restarting]);

  const reloadPreview = useCallback(() => setPreviewKey((key) => key + 1), []);

  return {
    url: boot.runtimeUrl,
    phase: boot.runtimePhase,
    message: boot.runtimeMessage,
    progress: boot.runtimeProgress,
    error: boot.runtimeError,
    logs,
    logsError,
    restart,
    restarting,
    restartError,
    previewKey,
    reloadPreview,
  };
}

export type RuntimeControl = ReturnType<typeof useRuntimeControl>;
