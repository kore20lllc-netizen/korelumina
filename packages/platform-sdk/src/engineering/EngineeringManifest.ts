import type {
  EngineeringTicketStatus,
} from "./types.js";

export interface EngineeringManifestEntry {
  id: string;
  title: string;
  status: EngineeringTicketStatus;
  updatedAt: number;
}

export interface EngineeringManifest {
  tickets: EngineeringManifestEntry[];
}

export function createEngineeringManifest(
  tickets: EngineeringManifestEntry[],
): EngineeringManifest {
  return {
    tickets,
  };
}
