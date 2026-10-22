import { useEffect, useMemo, useRef, useState } from "react";

import { useRuntimeOperations } from "@/hooks/useRuntimeOperations";
import type { HealthStatus, RuntimeAction, RuntimeProject, RuntimeState } from "@/services/runtime/types";

/*
 * MS-2026-0011: Runtime Operations state for the Knowledge Operations
 * design. Data and actions come from the existing live service; this adds
 * the selection, filters, confirmation of destructive actions, and the
 * keyboard shortcuts (/ search, R restart, S stop, Enter open project).
 */

export const DESTRUCTIVE: ReadonlySet<RuntimeAction> = new Set(["shutdown", "restart"]);

export function useRuntimeOpsView() {
  const operations = useRuntimeOperations();
  const { snapshot, dispatch } = operations;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [health, setHealth] = useState<HealthStatus | "all">("all");
  const [state, setState] = useState<RuntimeState | "all">("all");
  const [confirming, setConfirming] = useState<{ action: RuntimeAction; projectId: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const projects = useMemo(() => {
    const list = snapshot?.projects ?? [];
    const needle = query.trim().toLowerCase();
    return list
      .filter((project) => health === "all" || project.health.status === health)
      .filter((project) => state === "all" || project.state === state)
      .filter((project) => !needle || project.id.toLowerCase().includes(needle) || project.name.toLowerCase().includes(needle) || (project.process?.framework ?? "").toLowerCase().includes(needle))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [snapshot, query, health, state]);

  const selected: RuntimeProject | null = useMemo(() => {
    const all = snapshot?.projects ?? [];
    return all.find((project) => project.id === selectedId) ?? projects[0] ?? null;
  }, [snapshot, selectedId, projects]);

  const events = useMemo(() => (snapshot?.events ?? []).filter((event) => !selected || event.projectId === selected.id).slice(-80).reverse(), [snapshot, selected]);
  const timeline = useMemo(() => (snapshot?.timeline ?? []).filter((item) => !selected || item.projectId === selected.id).slice(-40).reverse(), [snapshot, selected]);
  const logs = useMemo(() => (snapshot?.logs ?? []).filter((entry) => !selected || entry.projectId === selected.id), [snapshot, selected]);

  /* Destructive actions ask first; starting does not. */
  const request = (action: RuntimeAction, projectId: string) => {
    if (DESTRUCTIVE.has(action)) setConfirming({ action, projectId });
    else void dispatch(action, projectId);
  };
  const confirm = () => {
    if (!confirming) return;
    void dispatch(confirming.action, confirming.projectId);
    setConfirming(null);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (!selected) return;
      const key = event.key.toLowerCase();
      if (key === "r") {
        event.preventDefault();
        request("restart", selected.id);
      } else if (key === "s") {
        event.preventDefault();
        request("shutdown", selected.id);
      } else if (key === "enter") {
        event.preventDefault();
        document.getElementById("runtime-ops-project")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return {
    ...operations,
    projects,
    selected,
    select: setSelectedId,
    query,
    setQuery,
    health,
    setHealth,
    state,
    setState,
    events,
    timeline,
    logs,
    request,
    confirming,
    confirm,
    cancel: () => setConfirming(null),
    searchRef,
  };
}

export type RuntimeOpsView = ReturnType<typeof useRuntimeOpsView>;
