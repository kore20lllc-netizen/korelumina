export interface Milestone {
  id: string;

  phase?: number;

  title: string;

  description: string;

  status:
    | "planned"
    | "active"
    | "completed";

  commit: string;

  tag?: string;

  adrIds: string[];

  engineeringTicketIds: string[];

  decisionIds: string[];

  runtimeEventIds: string[];

  startedAt: number;

  completedAt?: number;

  validated: boolean;
}
