export type ExecutiveDiscoverabilityStatus =
  | "planned"
  | "discoverable"
  | "cataloging"
  | "optimized"
  | "validated";

export interface ExecutiveDiscoverability {

  readonly id: string;

  readonly sessionId: string;

  readonly title: string;

  readonly ownerId: string;

  readonly status:
    ExecutiveDiscoverabilityStatus;

  readonly discoverabilityScore: number;

  readonly searchCoverage: number;

  readonly catalogCompleteness: number;

  readonly metadataQuality: number;

  readonly indexedAssets:
    readonly string[];

  readonly discoveryChannels:
    readonly string[];

  readonly createdAt: number;

  readonly updatedAt: number;

  readonly metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveDiscoverabilityInput {

  id: string;

  sessionId: string;

  title: string;

  ownerId: string;

  discoverabilityScore?: number;

  searchCoverage?: number;

  catalogCompleteness?: number;

  metadataQuality?: number;

  status?: ExecutiveDiscoverabilityStatus;

  indexedAssets?: readonly string[];

  discoveryChannels?: readonly string[];

  createdAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export function createExecutiveDiscoverability(
  input:
    CreateExecutiveDiscoverabilityInput,
): ExecutiveDiscoverability {

  const now =
    input.createdAt ??
    Date.now();

  return Object.freeze({
    id:
      input.id.trim(),

    sessionId:
      input.sessionId.trim(),

    title:
      input.title.trim(),

    ownerId:
      input.ownerId.trim(),

    status:
      input.status ??
      "planned",

    discoverabilityScore:
      Math.max(
        0,
        Math.min(
          100,
          input.discoverabilityScore ??
            100,
        ),
      ),

    searchCoverage:
      Math.max(
        0,
        Math.min(
          100,
          input.searchCoverage ??
            100,
        ),
      ),

    catalogCompleteness:
      Math.max(
        0,
        Math.min(
          100,
          input.catalogCompleteness ??
            100,
        ),
      ),

    metadataQuality:
      Math.max(
        0,
        Math.min(
          100,
          input.metadataQuality ??
            100,
        ),
      ),

    indexedAssets:
      Object.freeze([
        ...(input.indexedAssets ??
          []),
      ]),

    discoveryChannels:
      Object.freeze([
        ...(input.discoveryChannels ??
          []),
      ]),

    createdAt:
      now,

    updatedAt:
      now,

    metadata:
      Object.freeze({
        ...(input.metadata ??
          {}),
      }),
  });
}
