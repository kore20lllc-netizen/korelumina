import { useCallback, useState } from "react";
import {
  getCurrentRole,
  setCurrentRole as persistRole,
  type WorkspaceRole,
} from "@/services/workspaceAccessService";

export function useCurrentRole(): [WorkspaceRole, (role: WorkspaceRole) => void] {
  const [role, setRoleState] = useState<WorkspaceRole>(() => getCurrentRole());
  const setRole = useCallback((next: WorkspaceRole) => {
    persistRole(next);
    setRoleState(next);
  }, []);
  return [role, setRole];
}