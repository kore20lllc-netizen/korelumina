import { useCallback, useEffect, useRef, useState } from "react";

import { describeRuntimeError } from "@/components/workspaces/developer/shared/fileTree";
import { RuntimeDraftError, applyRuntimeDraft, revertRuntimeDraft } from "@/services/runtime/drafts";
import {
  analyzeWebsite,
  getWebsiteBuild,
  planWebsite,
  startWebsiteBuild,
  type WebsiteAnalysis,
  type WebsiteBuildJob,
  type WebsitePlan,
  type WebsitePlanPage,
} from "@/services/runtime/websiteTransform";

/*
 * MS-2026-0011: the Transform wizard's state, driven only by Runtime:
 * analysis, the model's plan, the build job's real steps, and the draft
 * that is applied or undone.
 */

export type TransformStage =
  | "analyzing"
  | "locked"
  | "unsupported"
  | "no-model"
  | "ready"
  | "planning"
  | "plan"
  | "building"
  | "review"
  | "applying"
  | "applied"
  | "reverting"
  | "reverted"
  | "error";

export interface EditablePage extends WebsitePlanPage {
  chosen: boolean;
}

const POLL_MS = 1_500;

export function describeTransformError(code: string): string {
  const [kind, detail] = code.split(":", 2);
  switch (kind) {
    case "transform_requires_pro":
      return "Transform App → Website is included from Pro.";
    case "transform_needs_ai_model":
      return "Transform needs an AI model. Set ANTHROPIC_API_KEY in Runtime's environment and restart it.";
    case "project_not_supported":
      return "This project is not one Transform can add pages to.";
    case "route_taken":
      return `The app already uses ${detail}. Choose another address.`;
    case "invalid_route":
      return `${detail} is not a valid address. Use lowercase letters, numbers and dashes, like /pricing.`;
    case "invalid_page_id":
      return `A page had an unusable name (${detail}).`;
    case "plan_no_longer_fits":
      return "The project changed since the plan was made.";
    case "no_pages_chosen":
      return "Choose at least one page.";
    case "ai_response_not_code":
      return "The model did not answer with the page's code.";
    case "routes_not_wired":
      return "The model could not add the routes to the router file.";
    case "layout_failed":
      return "The shared site layout could not be written.";
    case "pages_failed":
      return "Some pages could not be written, so nothing was drafted.";
    case "routes_failed":
      return "The routes could not be wired, so nothing was drafted.";
    case "not_started":
      return "Not started, because an earlier step failed.";
    case "job_not_found":
      return "Runtime restarted and no longer has this build. Build again.";
    default:
      return describeRuntimeError(code);
  }
}

function message(error: unknown, fallback: string): { text: string; reasons: string[] } {
  if (error instanceof RuntimeDraftError) {
    return { text: describeTransformError(error.message), reasons: error.reasons.map(describeTransformError) };
  }
  return { text: describeTransformError(error instanceof Error ? error.message : fallback), reasons: [] };
}

export function useWebsiteTransform(projectId: string | null, open: boolean) {
  const [stage, setStage] = useState<TransformStage>("analyzing");
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [plan, setPlan] = useState<WebsitePlan | null>(null);
  const [pages, setPages] = useState<EditablePage[]>([]);
  const [job, setJob] = useState<WebsiteBuildJob | null>(null);
  const [error, setError] = useState<{ text: string; reasons: string[] } | null>(null);
  const [errorStage, setErrorStage] = useState<TransformStage>("ready");
  const poll = useRef<number | null>(null);

  const stopPolling = () => {
    if (poll.current !== null) window.clearInterval(poll.current);
    poll.current = null;
  };

  const analyze = useCallback(async () => {
    if (!projectId) return;
    setStage("analyzing");
    setError(null);
    try {
      const result = await analyzeWebsite(projectId);
      setAnalysis(result.analysis);
      setModel(result.ai?.model ?? result.ai?.provider ?? null);
      setStage(!result.analysis.supported ? "unsupported" : !result.ai ? "no-model" : "ready");
    } catch (failure) {
      if (failure instanceof RuntimeDraftError && failure.message === "transform_requires_pro") {
        setStage("locked");
        return;
      }
      setError(message(failure, "failed_to_analyze"));
      setErrorStage("analyzing");
      setStage("error");
    }
  }, [projectId]);

  useEffect(() => {
    stopPolling();
    if (!open) return;
    setPlan(null);
    setPages([]);
    setJob(null);
    void analyze();
    return stopPolling;
  }, [open, analyze]);

  const makePlan = useCallback(async () => {
    if (!projectId) return;
    setStage("planning");
    setError(null);
    try {
      const result = await planWebsite(projectId);
      setAnalysis(result.analysis);
      setPlan(result.plan);
      setPages(result.plan.pages.map((page) => ({ ...page, chosen: true })));
      setStage("plan");
    } catch (failure) {
      setError(message(failure, "failed_to_plan"));
      setErrorStage("ready");
      setStage("error");
    }
  }, [projectId]);

  const updatePage = useCallback((id: string, patch: Partial<EditablePage>) => {
    setPages((current) => current.map((page) => (page.id === id ? { ...page, ...patch } : page)));
  }, []);

  const build = useCallback(async () => {
    if (!projectId) return;
    const chosen = pages.filter((page) => page.chosen).map(({ chosen: _chosen, ...page }) => page);
    setError(null);
    setStage("building");
    try {
      const started = await startWebsiteBuild(projectId, chosen, plan?.summary ?? "");
      setJob(started);
      stopPolling();
      poll.current = window.setInterval(async () => {
        try {
          const current = await getWebsiteBuild(started.jobId);
          setJob(current);
          if (current.status === "running") return;
          stopPolling();
          if (current.status === "done") {
            setStage("review");
          } else {
            setError({ text: describeTransformError(current.error ?? "pages_failed"), reasons: [] });
            setErrorStage("plan");
            setStage("error");
          }
        } catch (failure) {
          stopPolling();
          setError(message(failure, "job_not_found"));
          setErrorStage("plan");
          setStage("error");
        }
      }, POLL_MS);
    } catch (failure) {
      setError(message(failure, "failed_to_start_build"));
      setErrorStage("plan");
      setStage("error");
    }
  }, [projectId, pages, plan]);

  const apply = useCallback(async () => {
    if (!job?.draft) return;
    setStage("applying");
    setError(null);
    try {
      await applyRuntimeDraft(job.draft.id);
      setStage("applied");
    } catch (failure) {
      setError(message(failure, "failed_to_apply_runtime_draft"));
      setStage("review");
    }
  }, [job]);

  const undo = useCallback(async () => {
    if (!job?.draft) return;
    setStage("reverting");
    setError(null);
    try {
      await revertRuntimeDraft(job.draft.id);
      setStage("reverted");
    } catch (failure) {
      setError(message(failure, "failed_to_revert_runtime_draft"));
      setStage("applied");
    }
  }, [job]);

  const retry = useCallback(() => {
    setError(null);
    if (errorStage === "analyzing") void analyze();
    else setStage(errorStage === "plan" && pages.length > 0 ? "plan" : "ready");
  }, [errorStage, analyze, pages.length]);

  return {
    stage,
    analysis,
    model,
    plan,
    pages,
    updatePage,
    job,
    error,
    makePlan,
    build,
    apply,
    undo,
    retry,
  };
}

export type WebsiteTransform = ReturnType<typeof useWebsiteTransform>;
