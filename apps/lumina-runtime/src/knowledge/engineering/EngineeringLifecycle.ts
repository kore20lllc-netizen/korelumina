import {
  completeTicket,
  getTicket,
  updateTicket,
} from "./EngineeringService.js";

export function startTicket(
  id: string,
) {
  const ticket =
    getTicket(id);

  if (!ticket) {
    throw new Error(
      "engineering_ticket_not_found",
    );
  }

  updateTicket({
    ...ticket,
    status: "in_progress",
    startedAt:
      ticket.startedAt ??
      Date.now(),
  });
}

export function pauseTicket(
  id: string,
) {
  const ticket =
    getTicket(id);

  if (!ticket) {
    throw new Error(
      "engineering_ticket_not_found",
    );
  }

  updateTicket({
    ...ticket,
    pausedAt:
      Date.now(),
  });
}

export function resumeTicket(
  id: string,
) {
  const ticket =
    getTicket(id);

  if (!ticket) {
    throw new Error(
      "engineering_ticket_not_found",
    );
  }

  updateTicket({
    ...ticket,
    pausedAt:
      undefined,
  });
}

export function finishTicket(
  id: string,
  validation: string[] = [],
) {
  completeTicket(
    id,
    validation,
  );

  const ticket =
    getTicket(id);

  if (!ticket) {
    return;
  }

  updateTicket({
    ...ticket,
    completedAt:
      Date.now(),
  });
}

export function cancelTicket(
  id: string,
) {
  const ticket =
    getTicket(id);

  if (!ticket) {
    throw new Error(
      "engineering_ticket_not_found",
    );
  }

  updateTicket({
    ...ticket,
    status: "planned",
    cancelledAt:
      Date.now(),
  });
}
