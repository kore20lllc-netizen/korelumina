import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getKnowledgeCapabilities,
  type RuntimeCapabilityProvider,
} from "../../../../services/runtimeService";

import {
  KnowledgeHealthIcon,
  EvidenceCoverageIcon,
  CanonicalKnowledgeIcon,
} from "./ExecutiveOperationIcons";

export type ExecutiveRibbonMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  surface: string;
};

interface ExecutiveRibbonContextValue {
  providers: RuntimeCapabilityProvider[];
  loading: boolean;
  metrics: ExecutiveRibbonMetric[];
}

const ExecutiveRibbonContext =
  createContext<ExecutiveRibbonContextValue | null>(
    null,
  );

export function ExecutiveRibbonProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    providers,
    setProviders,
  ] = useState<RuntimeCapabilityProvider[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result =
          await getKnowledgeCapabilities();

        if (!cancelled) {
          setProviders(result);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(
    () => [
      {
        id: "knowledge-health",
        label: "Knowledge Health",
        value: loading ? "…" : "Healthy",
        detail: loading
          ? "Connecting to runtime"
          : "Runtime connected",
        icon: KnowledgeHealthIcon,
        accent: "text-emerald-300",
        surface: "bg-emerald-400/15",
      },
      {
        id: "providers",
        label: "Capability Providers",
        value: String(providers.length),
        detail: "Runtime registered",
        icon: EvidenceCoverageIcon,
        accent: "text-violet-300",
        surface: "bg-violet-400/15",
      },
      {
        id: "canonical",
        label: "Canonical Knowledge",
        value: "Runtime",
        detail: "Source of truth",
        icon: CanonicalKnowledgeIcon,
        accent: "text-amber-300",
        surface: "bg-amber-400/15",
      },
    ],
    [loading, providers],
  );

  return (
    <ExecutiveRibbonContext.Provider
      value={{
        providers,
        loading,
        metrics,
      }}
    >
      {children}
    </ExecutiveRibbonContext.Provider>
  );
}

export function useExecutiveRibbon() {
  const context = useContext(
    ExecutiveRibbonContext,
  );

  if (!context) {
    throw new Error(
      "useExecutiveRibbon must be used inside ExecutiveRibbonProvider",
    );
  }

  return context;
}
