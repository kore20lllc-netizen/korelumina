import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveReport,
  type CreateExecutiveReportInput,
  type ExecutiveReport,
  type ExecutiveReportStatus,
} from "./ExecutiveReport.js";

export class ExecutiveReportService {

  private readonly reports =
    new Map<
      string,
      ExecutiveReport
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveReportInput,
  ): ExecutiveReport {

    const report =
      createExecutiveReport(
        input,
      );

    this.reports.set(
      report.id,
      report,
    );

    this.timeline.record({
      id:
        `${report.id}:created`,
      sessionId:
        report.sessionId,
      type:
        "runtime-event",
      actorId:
        report.authorId,
      source:
        "executive-report",
      title:
        report.title,
      summary:
        report.summary,
      payload: {
        reportId:
          report.id,
      },
    });

    return report;
  }

  updateStatus(
    reportId: string,
    status:
      ExecutiveReportStatus,
  ): ExecutiveReport {

    const existing =
      this.reports.get(
        reportId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive report "${reportId}".`,
      );
    }

    const updated =
      Object.freeze({
        ...existing,
        status,
        updatedAt:
          Date.now(),
      });

    this.reports.set(
      reportId,
      updated,
    );

    this.timeline.record({
      id:
        `${reportId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.authorId,
      source:
        "executive-report",
      title:
        updated.title,
      summary:
        `Report status changed to ${status}.`,
      payload: {
        reportId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.reports.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.reports.values(),
      ),
    );
  }

  clear(): void {
    this.reports.clear();
  }
}

export function
createExecutiveReportService() {
  return new ExecutiveReportService();
}
