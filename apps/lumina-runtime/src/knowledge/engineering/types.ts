export type EngineeringTicketStatus =
  | "planned"
  | "in_progress"
  | "completed";

export interface EngineeringTicket {
  id: string;
  title: string;
  objective: string;

  status: EngineeringTicketStatus;

  architectureReferences: string[];

  filesChanged: string[];

  commits: string[];

  validation: string[];

  decisions: string[];

  createdAt: number;
  updatedAt: number;
}
