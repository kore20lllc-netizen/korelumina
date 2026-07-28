import { KNOWLEDGE_PACKAGES } from "../data/knowledgePackages";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export interface SelectedKnowledgePackage {
  id: string;
}

interface KnowledgeSelectionValue {
  selected: SelectedKnowledgePackage | null;
  select(id: string): void;
}

const KnowledgeSelectionContext =
  createContext<KnowledgeSelectionValue | null>(null);

export function KnowledgeSelectionProvider({
  children,
}: PropsWithChildren) {
  const [selected, setSelected] =
    useState<SelectedKnowledgePackage | null>({
      id: "PKG-421",
    });

  const activePackage =
    KNOWLEDGE_PACKAGES.find(
      (pkg) => pkg.id === selected?.id,
    ) ?? null;

  const value = useMemo(
    () => ({
      selected,
      activePackage,
      select(id: string) {
        setSelected({ id });
      },
    }),
    [activePackage, selected],
  );

  return (
    <KnowledgeSelectionContext.Provider value={value}>
      {children}
    </KnowledgeSelectionContext.Provider>
  );
}

export function useKnowledgeSelection() {
  const context = useContext(
    KnowledgeSelectionContext,
  );

  if (!context) {
    throw new Error(
      "KnowledgeSelectionProvider is missing.",
    );
  }

  return context;
}
