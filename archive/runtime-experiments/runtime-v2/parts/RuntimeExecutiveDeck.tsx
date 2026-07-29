import {
  forwardRef,
} from "react";

import type {
  Environment,
  HealthStatus,
  RuntimeOverview,
  RuntimeProject,
} from "@/services/runtime/types";

import {
  RuntimeHeader,
} from "./RuntimeHeader";

import {
  RuntimeHealthOverview,
} from "./RuntimeHealthOverview";

export interface RuntimeExecutiveDeckProps {
  overall: RuntimeOverview;
  projects: RuntimeProject[];
  updatedAt: number;
  query: string;
  onQuery: (value: string) => void;
  env: Environment | "all";
  onEnv: (
    value: Environment | "all",
  ) => void;
  health: HealthStatus | "all";
  onHealth: (
    value: HealthStatus | "all",
  ) => void;
}

export const RuntimeExecutiveDeck =
  forwardRef<
    HTMLInputElement,
    RuntimeExecutiveDeckProps
  >(
    (
      {
        overall,
        projects,
        updatedAt,
        query,
        onQuery,
        env,
        onEnv,
        health,
        onHealth,
      },
      ref,
    ) => {
      return (
        <section className="flex flex-col gap-5 lg:gap-6">
          <RuntimeHeader
            ref={ref}
            overall={overall}
            updatedAt={updatedAt}
            query={query}
            onQuery={onQuery}
            env={env}
            onEnv={onEnv}
            health={health}
            onHealth={onHealth}
          />

          <RuntimeHealthOverview
            overall={overall}
            projects={projects}
          />
        </section>
      );
    },
  );

RuntimeExecutiveDeck.displayName =
  "RuntimeExecutiveDeck";

export default RuntimeExecutiveDeck;
