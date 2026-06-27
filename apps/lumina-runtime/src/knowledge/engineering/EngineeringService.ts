import {
  loadTicket,
  listTickets,
  removeTicket,
  saveTicket,
} from "./EngineeringStore.js";

import type {
  EngineeringTicket,
} from "./types.js";

export function createTicket(
  ticket: EngineeringTicket,
) {
  if (loadTicket(ticket.id)) {
    throw new Error(
      "engineering_ticket_exists",
    );
  }

  const now = Date.now();

  saveTicket({
    ...ticket,
    createdAt:
      ticket.createdAt || now,
    updatedAt:
      ticket.updatedAt || now,
  });
}

export function updateTicket(
  ticket: EngineeringTicket,
) {
  const existing =
    loadTicket(ticket.id);

  if (!existing) {
    throw new Error(
      "engineering_ticket_not_found",
    );
  }

  saveTicket({
    ...ticket,
    createdAt:
      existing.createdAt,
    updatedAt:
      Date.now(),
  });
}

export function completeTicket(
  id: string,
  validation: string[] = [],
) {
  const existing =
    loadTicket(id);

  if (!existing) {
    throw new Error(
      "engineering_ticket_not_found",
    );
  }

  saveTicket({
    ...existing,
    status: "completed",
    validation: [
      ...existing.validation,
      ...validation,
    ],
    updatedAt: Date.now(),
  });
}

export function deleteTicket(
  id: string,
) {
  removeTicket(id);
}

export function getTicket(
  id: string,
) {
  return loadTicket(id);
}

export function getAllTickets() {
  return listTickets();
}
