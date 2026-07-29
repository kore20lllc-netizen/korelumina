import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveMaturity,
  type CreateExecutiveMaturityInput,
  type ExecutiveMaturity,
  type ExecutiveMaturityStatus,
} from "./ExecutiveMaturity.js";

export class
ExecutiveMaturityService {

  private readonly records =
    new Map<
      string,
      ExecutiveMaturity
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveMaturityInput,
  ): ExecutiveMaturity {

    const record =
      createExecutiveMaturity(
        input,
      );

    this.records.set(
      record.id,
      record,
    );

    this.timeline.record({
      id:
        `${record.id}:created`,
      sessionId:
        record.sessionId,
      type:
        "runtime-event",
      actorId:
        record.ownerId,
      source:
        "executive-maturity",
      title:
        record.title,
      summary:
        `Maturity score ${record.maturityScore}`,
      payload: {
        maturityId:
          record.id,
        maturityScore:
          record.maturityScore,
        governanceMaturity:
          record.governanceMaturity,
        processMaturity:
          record.processMaturity,
        operationalMaturity:
          record.operationalMaturity,
      },
    });

    return record;
  }

  updateStatus(
    maturityId: string,
    status:
      ExecutiveMaturityStatus,
  ): ExecutiveMaturity {

    const existing =
      this.records.get(
        maturityId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive maturity "${maturityId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.records.set(
      maturityId,
      updated,
    );

    this.timeline.record({
      id:
        `${maturityId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-maturity",
      title:
        updated.title,
      summary:
        `Maturity status changed to ${status}.`,
      payload: {
        maturityId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.records.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.records.values(),
      ),
    );
  }

  clear(): void {
    this.records.clear();
  }
}

export function
createExecutiveMaturityService() {
  return new ExecutiveMaturityService();
}
