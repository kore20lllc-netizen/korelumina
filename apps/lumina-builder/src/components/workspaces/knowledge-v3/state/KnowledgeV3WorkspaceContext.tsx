import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import type {
  KnowledgeV3Domain,
} from "./types";

interface KnowledgeV3WorkspaceContextValue {
  activeDomain: KnowledgeV3Domain;
  setActiveDomain(
    domain: KnowledgeV3Domain,
  ): void;
}

const KnowledgeV3WorkspaceContext =
  createContext<
    KnowledgeV3WorkspaceContextValue | null
  >(null);

interface KnowledgeV3WorkspaceProviderProps {
  children: ReactNode;
}

export function KnowledgeV3WorkspaceProvider({
  children,
}: KnowledgeV3WorkspaceProviderProps) {
  const [
    activeDomain,
    setActiveDomain,
  ] = useState<KnowledgeV3Domain>(
    "learning",
  );

  const value = useMemo(
    () => ({
      activeDomain,
      setActiveDomain,
    }),
    [activeDomain],
  );

  return (
    <KnowledgeV3WorkspaceContext.Provider
      value={value}
    >
      {children}
    </KnowledgeV3WorkspaceContext.Provider>
  );
}

export function useKnowledgeV3Workspace() {
  const context = useContext(
    KnowledgeV3WorkspaceContext,
  );

  if (!context) {
    throw new Error(
      "useKnowledgeV3Workspace must be used within KnowledgeV3WorkspaceProvider",
    );
  }

  return context;
}
