import type {
  ExecutiveEvent,
  ExecutiveEventCategory,
} from "../events/index.js";

export type ExecutiveDestination =
  | "reasoning"
  | "planning"
  | "decision"
  | "execution"
  | "learning"
  | "organizational-memory"
  | "capability"
  | "experience"
  | "interaction"
  | "governance"
  | "none";

export interface ExecutiveRoute {
  eventId: string;

  destinations:
    readonly ExecutiveDestination[];

  reason: string;
}

export interface ExecutiveRouter {
  route(
    event: ExecutiveEvent,
  ): ExecutiveRoute;
}

const categoryDestinations:
  Readonly<
    Record<
      ExecutiveEventCategory,
      readonly ExecutiveDestination[]
    >
  > = {
    genesis: [
      "organizational-memory",
      "learning",
      "experience",
    ],

    architecture: [
      "reasoning",
      "organizational-memory",
      "learning",
      "experience",
    ],

    knowledge: [
      "organizational-memory",
      "learning",
      "experience",
    ],

    design: [
      "organizational-memory",
      "learning",
      "experience",
    ],

    engineering: [
      "execution",
      "organizational-memory",
      "learning",
      "experience",
    ],

    runtime: [
      "execution",
      "organizational-memory",
      "learning",
      "experience",
    ],

    governance: [
      "decision",
      "governance",
      "organizational-memory",
      "experience",
    ],

    mission: [
      "planning",
      "decision",
      "organizational-memory",
      "experience",
    ],

    customer: [
      "reasoning",
      "organizational-memory",
      "learning",
      "experience",
    ],

    business: [
      "reasoning",
      "planning",
      "decision",
      "organizational-memory",
      "experience",
    ],

    security: [
      "decision",
      "execution",
      "governance",
      "organizational-memory",
      "experience",
    ],

    quality: [
      "reasoning",
      "execution",
      "learning",
      "organizational-memory",
      "experience",
    ],

    system: [
      "organizational-memory",
    ],
  };

export class DefaultExecutiveRouter
  implements ExecutiveRouter
{
  route(
    event: ExecutiveEvent,
  ): ExecutiveRoute {
    const destinations =
      categoryDestinations[
        event.category
      ] ?? ["none"];

    return {
      eventId: event.id,

      destinations:
        Array.from(
          new Set(destinations),
        ),

      reason:
        `Executive category "${event.category}" routes through its canonical runtime domains.`,
    };
  }
}
