import {
  createTicket,
} from "./EngineeringService.js";

import type {
  EngineeringTicket,
} from "./types.js";

export interface CompletedEngineeringTicket {
  id: string;
  title: string;
  objective: string;

  architectureReferences: string[];

  filesChanged: string[];

  commits: string[];

  validation: string[];

  decisions?: string[];

  createdAt?: number;
  updatedAt?: number;
}

export function recordCompletedTicket(
  input: CompletedEngineeringTicket,
) {
  const now = Date.now();

  const ticket: EngineeringTicket = {
    id: input.id,
    title: input.title,
    objective: input.objective,

    status: "completed",

    architectureReferences:
      input.architectureReferences,

    filesChanged:
      input.filesChanged,

    commits:
      input.commits,

    validation:
      input.validation,

    decisions:
      input.decisions ?? [],

    createdAt:
      input.createdAt ?? now,

    updatedAt:
      input.updatedAt ?? now,
  };

  createTicket(ticket);

  return ticket;
}
