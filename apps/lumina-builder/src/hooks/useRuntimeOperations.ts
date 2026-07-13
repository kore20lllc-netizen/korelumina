import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  runtimeOperationsService,
} from "@/services/runtime";

import type {
  RuntimeAction,
  RuntimeScenario,
  RuntimeSnapshot,
} from "@/services/runtime/types";

export type UseRuntimeStatus =
  | "loading"
  | "ready"
  | "error";

export interface UseRuntimeOperationsReturn {
  snapshot: RuntimeSnapshot | null;
  status: UseRuntimeStatus;
  error: Error | null;

  dispatch: (
    action: RuntimeAction,
    projectId: string,
  ) => Promise<void>;

  setScenario: (
    scenario: RuntimeScenario,
    projectId: string,
  ) => Promise<void>;

  scenarioPending:
    RuntimeScenario | null;

  reload: () => void;

  pending: Record<
    string,
    boolean
  >;
}

export function useRuntimeOperations():
  UseRuntimeOperationsReturn {
  const [
    snapshot,
    setSnapshot,
  ] = useState<RuntimeSnapshot | null>(
    null,
  );

  const [
    status,
    setStatus,
  ] = useState<UseRuntimeStatus>(
    "loading",
  );

  const [
    error,
    setError,
  ] = useState<Error | null>(
    null,
  );

  const [
    pending,
    setPending,
  ] = useState<
    Record<string, boolean>
  >({});

  const [
    scenarioPending,
    setScenarioPending,
  ] = useState<
    RuntimeScenario | null
  >(null);

  const [
    reloadGeneration,
    setReloadGeneration,
  ] = useState(0);

  useEffect(() => {
    let active = true;
    let firstSnapshotDelivered =
      false;

    setStatus("loading");
    setError(null);

    try {
      const unsubscribe =
        runtimeOperationsService.subscribe(
          (nextSnapshot) => {
            if (!active) {
              return;
            }

            setSnapshot(
              nextSnapshot,
            );

            if (
              !firstSnapshotDelivered
            ) {
              firstSnapshotDelivered =
                true;

              setStatus("ready");
            }
          },
        );

      return () => {
        active = false;
        unsubscribe();
      };
    } catch (caughtError) {
      setError(
        caughtError as Error,
      );

      setStatus("error");
    }

    return () => {
      active = false;
    };
  }, [reloadGeneration]);

  const dispatch =
    useCallback(
      async (
        action: RuntimeAction,
        projectId: string,
      ) => {
        const pendingKey =
          `${projectId}:${action}`;

        setPending(
          (current) => ({
            ...current,
            [pendingKey]: true,
          }),
        );

        try {
          await runtimeOperationsService.dispatch(
            action,
            projectId,
          );

          toast.success(
            `${action} dispatched`,
          );
        } catch (caughtError) {
          const runtimeError =
            caughtError as Error;

          toast.error(
            runtimeError.message ||
              `Failed to ${action}`,
          );

          throw runtimeError;
        } finally {
          setPending(
            (current) => {
              const {
                [pendingKey]: _removed,
                ...remaining
              } = current;

              return remaining;
            },
          );
        }
      },
      [],
    );

  const setScenario =
    useCallback(
      async (
        scenario: RuntimeScenario,
        projectId: string,
      ) => {
        setScenarioPending(
          scenario,
        );

        try {
          await runtimeOperationsService.setScenario(
            projectId,
            scenario,
          );

          toast.success(
            `${scenario} scenario applied`,
          );
        } catch (caughtError) {
          const runtimeError =
            caughtError as Error;

          toast.error(
            runtimeError.message ||
              `Failed to apply ${scenario}`,
          );

          throw runtimeError;
        } finally {
          setScenarioPending(
            null,
          );
        }
      },
      [],
    );

  const reload =
    useCallback(() => {
      setSnapshot(null);
      setStatus("loading");

      setReloadGeneration(
        (current) =>
          current + 1,
      );
    }, []);

  return {
    snapshot,
    status,
    error,
    dispatch,
    setScenario,
    scenarioPending,
    reload,
    pending,
  };
}
