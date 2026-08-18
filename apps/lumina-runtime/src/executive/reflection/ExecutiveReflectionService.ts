import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveReflectionRecord,
  type CreateExecutiveReflectionRecordInput,
  type ExecutiveReflectionRecord,
  type ExecutiveReflectionStatus,
} from "./ExecutiveReflection.js";

export class ExecutiveReflectionService {

  private readonly reflections =
    new Map<string, ExecutiveReflectionRecord>();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input: CreateExecutiveReflectionRecordInput,
  ): ExecutiveReflectionRecord {

    const reflection =
      createExecutiveReflectionRecord(input);

    this.reflections.set(
      reflection.id,
      reflection,
    );

    this.timeline.record({
      id: `${reflection.id}:created`,
      sessionId: reflection.sessionId,
      type: "reflection",
      actorId: reflection.authorId,
      source: "executive-reflection",
      title: reflection.title,
      summary: reflection.summary,
      payload: {
        reflectionId: reflection.id,
      },
    });

    return reflection;
  }

  updateStatus(
    reflectionId: string,
    status: ExecutiveReflectionStatus,
  ): ExecutiveReflectionRecord {

    const existing =
      this.reflections.get(reflectionId);

    if (!existing) {
      throw new Error(
        `Unknown executive reflection "${reflectionId}".`,
      );
    }

    const updated = Object.freeze({
      ...existing,
      status,
      updatedAt: Date.now(),
    });

    this.reflections.set(
      reflectionId,
      updated,
    );

    this.timeline.record({
      id: `${reflectionId}:${status}`,
      sessionId: updated.sessionId,
      type: "reflection",
      actorId: updated.authorId,
      source: "executive-reflection",
      title: updated.title,
      summary: `Reflection status changed to ${status}.`,
      payload: {
        reflectionId,
        status,
      },
    });

    return updated;
  }

  get(id: string) {
    return this.reflections.get(id);
  }

  list() {
    return Object.freeze(
      Array.from(this.reflections.values()),
    );
  }

  clear(): void {
    this.reflections.clear();
  }
}

export function createExecutiveReflectionService() {
  return new ExecutiveReflectionService();
}
