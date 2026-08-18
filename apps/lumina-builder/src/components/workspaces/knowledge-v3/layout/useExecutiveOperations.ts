import { useMemo } from "react";

import {
  EXECUTIVE_OPERATIONS,
  type ExecutiveOperation,
} from "./executiveOperations";

export function useExecutiveOperations(): ExecutiveOperation[] {
  return useMemo(
    () => EXECUTIVE_OPERATIONS,
    [],
  );
}
