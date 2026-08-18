export type ExecutiveOperationState =
  | "healthy"
  | "active"
  | "warning"
  | "error";

export type ExecutiveOperationIcon =
  | "runtime"
  | "compiler"
  | "repository"
  | "intelligence"
  | "knowledge";

export interface ExecutiveOperation {
  id: string;
  label: string;
  status: string;
  detail: string;
  state: ExecutiveOperationState;
  icon: ExecutiveOperationIcon;
}

export const EXECUTIVE_OPERATIONS: ExecutiveOperation[] = [
  {
    id: "runtime",
    label: "Runtime",
    status: "Healthy",
    detail: "Operational fabric online",
    state: "healthy",
    icon: "runtime",
  },
  {
    id: "compiler",
    label: "Compiler",
    status: "Ready",
    detail: "Production compiler available",
    state: "active",
    icon: "compiler",
  },
  {
    id: "repository",
    label: "Repository",
    status: "Synced",
    detail: "Knowledge sources aligned",
    state: "healthy",
    icon: "repository",
  },
  {
    id: "intelligence",
    label: "AI Intelligence",
    status: "Ready",
    detail: "Orchestration services available",
    state: "active",
    icon: "intelligence",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    status: "Current",
    detail: "Institutional state verified",
    state: "healthy",
    icon: "knowledge",
  },
];
