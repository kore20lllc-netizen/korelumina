import {
  ExecutiveTimelineService,
} from "../timeline/ExecutiveTimelineService.js";

import {
  createExecutiveMeeting,
  type CreateExecutiveMeetingInput,
  type ExecutiveMeeting,
  type ExecutiveMeetingStatus,
} from "./ExecutiveMeeting.js";

export class ExecutiveMeetingService {

  private readonly meetings =
    new Map<
      string,
      ExecutiveMeeting
    >();

  constructor(
    private readonly timeline =
      new ExecutiveTimelineService(),
  ) {}

  create(
    input:
      CreateExecutiveMeetingInput,
  ): ExecutiveMeeting {

    const meeting =
      createExecutiveMeeting(
        input,
      );

    this.meetings.set(
      meeting.id,
      meeting,
    );

    this.timeline.record({
      id:
        `${meeting.id}:created`,
      sessionId:
        meeting.sessionId,
      type:
        "conversation-started",
      actorId:
        meeting.facilitatorId,
      source:
        "executive-meeting",
      title:
        meeting.title,
      summary:
        meeting.objective,
      payload: {
        meetingId:
          meeting.id,
      },
    });

    return meeting;
  }

  updateStatus(
    meetingId: string,
    status:
      ExecutiveMeetingStatus,
  ): ExecutiveMeeting {

    const existing =
      this.meetings.get(
        meetingId,
      );

    if (!existing) {
      throw new Error(
        `Unknown executive meeting "${meetingId}".`,
      );
    }

    const now =
      Date.now();

    const updated =
      Object.freeze({
        ...existing,
        status,
        startedAt:
          status === "active"
            ? existing.startedAt ??
              now
            : existing.startedAt,
        endedAt:
          status ===
            "completed"
            ? now
            : existing.endedAt,
        updatedAt:
          now,
      });

    this.meetings.set(
      meetingId,
      updated,
    );

    this.timeline.record({
      id:
        `${meetingId}:${status}`,
      sessionId:
        updated.sessionId,
      type:
        "runtime-event",
      actorId:
        updated.facilitatorId,
      source:
        "executive-meeting",
      title:
        updated.title,
      summary:
        `Meeting status changed to ${status}.`,
      payload: {
        meetingId,
        status,
      },
    });

    return updated;
  }

  get(
    id: string,
  ) {
    return this.meetings.get(
      id,
    );
  }

  list() {
    return Object.freeze(
      Array.from(
        this.meetings.values(),
      ),
    );
  }

  clear(): void {
    this.meetings.clear();
  }
}

export function
createExecutiveMeetingService() {
  return new ExecutiveMeetingService();
}
