import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { runtimeOperationsService } from "@/services/runtime";
import type { RuntimeAction, RuntimeSnapshot } from "@/services/runtime/types";

export type UseRuntimeStatus = "loading" | "ready" | "error";

export interface UseRuntimeOperationsReturn {
  snapshot: RuntimeSnapshot | null;
  status: UseRuntimeStatus;
  error: Error | null;
  dispatch: (action: RuntimeAction, projectId: string) => Promise<void>;
  reload: () => void;
  pending: Record<string, boolean>;
}

/**
 * Presentation-layer hook wrapping the Runtime Operations service. This is the
 * ONLY module (besides `services/runtime/*`) that touches the service — every
 * component in `workspaces/runtime/parts/*` accepts data via props.
 */
export function useRuntimeOperations(): UseRuntimeOperationsReturn {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [status, setStatus] = useState<UseRuntimeStatus>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const bumpRef = useRef(0);

  useEffect(() => {
    setStatus("loading");
    setError(null);
    let alive = true;
    let firstDelivered = false;
    try {
      const off = runtimeOperationsService.subscribe((s) => {
        if (!alive) return;
        setSnapshot(s);
        if (!firstDelivered) {
          firstDelivered = true;
          setStatus("ready");
        }
      });
      return () => { alive = false; off(); };
    } catch (e) {
      setError(e as Error);
      setStatus("error");
    }
  }, [bumpRef.current]);

  const dispatch = useCallback(async (action: RuntimeAction, projectId: string) => {
    const key = `${projectId}:${action}`;
    setPending((p) => ({ ...p, [key]: true }));
    try {
      await runtimeOperationsService.dispatch(action, projectId);
      toast.success(`${action} dispatched`);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || `Failed to ${action}`);
      throw err;
    } finally {
      setPending((p) => {
        const { [key]: _, ...rest } = p;
        return rest;
      });
    }
  }, []);


  const reload = useCallback(() => {
    bumpRef.current += 1;
    setSnapshot(null);
    setStatus("loading");
  }, []);

  return { snapshot, status, error, dispatch, reload, pending };
}