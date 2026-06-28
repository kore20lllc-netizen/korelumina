import type {
  EngineerAgentAction,
} from "./EngineerAgentAction.js";

export interface EngineerAgentRun {
  id: string;

  requestId: string;

  objective: string;

  actions: EngineerAgentAction[];

  references: string[];
}
