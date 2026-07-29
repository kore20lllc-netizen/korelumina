import {
  assertExecutiveSessionTransition,
  type ExecutiveSessionState,
} from "./ExecutiveSessionState.js";

import type {
  ExecutiveParticipant,
} from "./ExecutiveParticipant.js";

import type {
  ExecutiveIntent,
} from "./ExecutiveIntent.js";

export interface ExecutiveSession {
  id: string;
  state: ExecutiveSessionState;
  participants: readonly ExecutiveParticipant[];
  intent: ExecutiveIntent;
  metadata: Readonly<Record<string, unknown>>;
  createdAt: number;
  updatedAt: number;
}

export interface CreateExecutiveSessionInput {
  id: string;
  participants: readonly ExecutiveParticipant[];
  intent: ExecutiveIntent;
  metadata?: Readonly<Record<string, unknown>>;
  createdAt?: number;
}

export class ExecutiveSessionAggregate {

  private session: ExecutiveSession;

  constructor(
    input: CreateExecutiveSessionInput,
  ) {

    const createdAt =
      input.createdAt ??
      Date.now();

    this.session = Object.freeze({
      id: input.id,
      state: "created",
      participants: Object.freeze([
        ...input.participants,
      ]),
      intent: input.intent,
      metadata: Object.freeze({
        ...(input.metadata ?? {}),
      }),
      createdAt,
      updatedAt: createdAt,
    });
  }

  snapshot(): ExecutiveSession {
    return this.session;
  }

  transition(
    nextState: ExecutiveSessionState,
  ): void {

    assertExecutiveSessionTransition(
      this.session.state,
      nextState,
    );

    this.session = Object.freeze({
      ...this.session,
      state: nextState,
      updatedAt: Date.now(),
    });
  }

  activate() {
    this.transition("active");
  }

  beginBriefing() {
    this.transition("briefing");
  }

  beginReview() {
    this.transition("review");
  }

  markDecisionPending() {
    this.transition("decision-pending");
  }

  approve() {
    this.transition("approved");
  }

  beginExecution() {
    this.transition("executing");
  }

  beginObservation() {
    this.transition("observing");
  }

  beginReflection() {
    this.transition("reflecting");
  }

  complete() {
    this.transition("completed");
  }

  archive() {
    this.transition("archived");
  }
}
