import { useMemo } from "react";
import {
  deriveExecutiveOperations,
  deriveExecutiveOverall,
  type ExecutiveOperation,
  type ExecutiveOverall,
} from "./executiveOperations";
import { useKnowledgeOperationsTruth } from "./useKnowledgeOperationsTruth";

export function useExecutiveOperations(): ExecutiveOperation[] {
  const truth = useKnowledgeOperationsTruth();
  return useMemo(() => deriveExecutiveOperations(truth), [truth]);
}

export function useExecutiveOverall(): ExecutiveOverall {
  const truth = useKnowledgeOperationsTruth();
  return useMemo(
    () => deriveExecutiveOverall(deriveExecutiveOperations(truth), truth),
    [truth],
  );
}
