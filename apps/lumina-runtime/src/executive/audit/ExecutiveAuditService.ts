import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveAudit,
  type CreateExecutiveAuditInput,
  type ExecutiveAudit,
  type ExecutiveAuditStatus,
} from "./ExecutiveAudit.js";

export class ExecutiveAuditService {

  private readonly audits =
    new Map<
      string,
      ExecutiveAudit
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveAuditInput,
  ): ExecutiveAudit {

    const audit =
      createExecutiveAudit(
        input,
      );

    this.audits.set(
      audit.id,
      audit,
    );

    this.timeline.record({
      id:
        `${audit.id}:created`,
      sessionId:
        audit.sessionId,
      type:
        "runtime-event",
      actorId:
        audit.ownerId,
      source:
        "executive-audit",
      title:
        audit.title,
      summary:
        audit.description,
      payload: {
        auditId:
          audit.id,
        severity:
          audit.severity,
      },
    });

    return audit;
  }

  updateStatus(
    auditId: string,
    status:
      ExecutiveAuditStatus,
  ): ExecutiveAudit {

    const existing =
      this.audits.get(
        auditId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive audit "${auditId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.audits.set(
      auditId,
      updated,
    );

    this.timeline.record({
      id:
        `${auditId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.ownerId,
      source:
        "executive-audit",
      title:
        updated.title,
      summary:
        `Audit status changed to ${status}.`,
      payload: {
        auditId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.audits.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.audits.values(),
      ),
    );
  }

  clear(): void {
    this.audits.clear();
  }
}

export function
createExecutiveAuditService() {
  return new ExecutiveAuditService();
}
