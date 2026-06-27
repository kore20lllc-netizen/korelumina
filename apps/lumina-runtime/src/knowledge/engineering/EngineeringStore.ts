import {
  FileStore,
  JsonStore,
  KnowledgeStore,
} from "../index.js";

import {
  getEngineeringKnowledgeRoot,
} from "../../projects/knowledgePaths.js";

import type {
  EngineeringTicket,
} from "./types.js";

const fileStore =
  new FileStore(
    getEngineeringKnowledgeRoot(),
  );

const jsonStore =
  new JsonStore(
    fileStore,
  );

const store =
  new KnowledgeStore(
    jsonStore,
  );

export function saveTicket(
  ticket: EngineeringTicket,
) {
  store.save({
    id: ticket.id,
    type: "engineering-ticket",
    version: 1,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    data: ticket,
  });
}

export function loadTicket(
  id: string,
) {
  return store.load<EngineeringTicket>(
    id,
  );
}

export function listTickets() {
  return store.list();
}

export function removeTicket(
  id: string,
) {
  store.remove(id);
}
