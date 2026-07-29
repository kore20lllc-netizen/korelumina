import type {
  ExecutiveExperience,
} from "./ExecutiveExperience.js";
import type {
  ExecutiveMemoryRecord,
} from "./ExecutiveMemoryRecord.js";
import type {
  ExecutiveObservation,
} from "./ExecutiveObservation.js";
import type {
  ExecutivePatternCandidate,
} from "./ExecutivePatternCandidate.js";
import type {
  ExecutiveReflection,
} from "./ExecutiveReflection.js";

export interface ExecutiveMemoryStore {
  saveObservation(
    observation:
      ExecutiveObservation,
  ): Promise<void>;

  getObservation(
    id: string,
  ): Promise<
    ExecutiveObservation | undefined
  >;

  saveMemoryRecord(
    record:
      ExecutiveMemoryRecord,
  ): Promise<void>;

  getMemoryRecord(
    id: string,
  ): Promise<
    ExecutiveMemoryRecord | undefined
  >;

  saveExperience(
    experience:
      ExecutiveExperience,
  ): Promise<void>;

  getExperience(
    id: string,
  ): Promise<
    ExecutiveExperience | undefined
  >;

  saveReflection(
    reflection:
      ExecutiveReflection,
  ): Promise<void>;

  getReflection(
    id: string,
  ): Promise<
    ExecutiveReflection | undefined
  >;

  savePatternCandidate(
    pattern:
      ExecutivePatternCandidate,
  ): Promise<void>;

  getPatternCandidate(
    id: string,
  ): Promise<
    ExecutivePatternCandidate | undefined
  >;
}

export class InMemoryExecutiveMemoryStore
  implements ExecutiveMemoryStore
{
  private readonly observations =
    new Map<
      string,
      ExecutiveObservation
    >();

  private readonly memoryRecords =
    new Map<
      string,
      ExecutiveMemoryRecord
    >();

  private readonly experiences =
    new Map<
      string,
      ExecutiveExperience
    >();

  private readonly reflections =
    new Map<
      string,
      ExecutiveReflection
    >();

  private readonly patternCandidates =
    new Map<
      string,
      ExecutivePatternCandidate
    >();

  async saveObservation(
    observation:
      ExecutiveObservation,
  ): Promise<void> {
    this.assertNew(
      this.observations,
      observation.id,
      "observation",
    );

    this.observations.set(
      observation.id,
      observation,
    );
  }

  async getObservation(
    id: string,
  ): Promise<
    ExecutiveObservation | undefined
  > {
    return this.observations.get(
      id,
    );
  }

  async saveMemoryRecord(
    record:
      ExecutiveMemoryRecord,
  ): Promise<void> {
    this.assertNew(
      this.memoryRecords,
      record.id,
      "memory record",
    );

    this.memoryRecords.set(
      record.id,
      record,
    );
  }

  async getMemoryRecord(
    id: string,
  ): Promise<
    ExecutiveMemoryRecord | undefined
  > {
    return this.memoryRecords.get(
      id,
    );
  }

  async saveExperience(
    experience:
      ExecutiveExperience,
  ): Promise<void> {
    this.assertNew(
      this.experiences,
      experience.id,
      "experience",
    );

    this.experiences.set(
      experience.id,
      experience,
    );
  }

  async getExperience(
    id: string,
  ): Promise<
    ExecutiveExperience | undefined
  > {
    return this.experiences.get(
      id,
    );
  }

  async saveReflection(
    reflection:
      ExecutiveReflection,
  ): Promise<void> {
    this.assertNew(
      this.reflections,
      reflection.id,
      "reflection",
    );

    this.reflections.set(
      reflection.id,
      reflection,
    );
  }

  async getReflection(
    id: string,
  ): Promise<
    ExecutiveReflection | undefined
  > {
    return this.reflections.get(
      id,
    );
  }

  async savePatternCandidate(
    pattern:
      ExecutivePatternCandidate,
  ): Promise<void> {
    this.assertNew(
      this.patternCandidates,
      pattern.id,
      "pattern candidate",
    );

    this.patternCandidates.set(
      pattern.id,
      pattern,
    );
  }

  async getPatternCandidate(
    id: string,
  ): Promise<
    ExecutivePatternCandidate | undefined
  > {
    return this.patternCandidates.get(
      id,
    );
  }

  private assertNew<T>(
    store:
      ReadonlyMap<string, T>,
    id: string,
    entity: string,
  ): void {
    if (store.has(id)) {
      throw new Error(
        `Executive ${entity} "${id}" already exists.`,
      );
    }
  }
}
