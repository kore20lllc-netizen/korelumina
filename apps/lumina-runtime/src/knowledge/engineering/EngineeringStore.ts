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

import {
  loadEngineeringManifest,
  saveEngineeringManifest,
} from "./EngineeringManifestStore.js";

import type {
  EngineeringManifestEntry,
} from "./EngineeringManifest.js";

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



function updateManifest(
  ticket: EngineeringTicket,
) {
  const manifest =
    loadEngineeringManifest();

  const entry: EngineeringManifestEntry = {
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    updatedAt: ticket.updatedAt,
  };

  const index =
    manifest.tickets.findIndex(
      (t) => t.id === ticket.id,
    );

  if (index >= 0) {
    manifest.tickets[index] = entry;
  } else {
    manifest.tickets.push(entry);
  }

  manifest.tickets.sort(
    (a, b) =>
      b.updatedAt - a.updatedAt,
  );

  saveEngineeringManifest(
    manifest,
  );
}

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

  updateManifest(ticket);
}

export function loadTicket(
  id: string,
): EngineeringTicket | null {
  const record =
    store.load<EngineeringTicket>(
      id,
    );

  return (
    record?.data ?? null
  );
}

export function listTickets() {
  return store.list();
}

export function removeTicket(
  id: string,
) {
  store.remove(id);

  const manifest =
    loadEngineeringManifest();

  manifest.tickets =
    manifest.tickets.filter(
      (t) => t.id !== id,
    );

  saveEngineeringManifest(
    manifest,
  );
}
