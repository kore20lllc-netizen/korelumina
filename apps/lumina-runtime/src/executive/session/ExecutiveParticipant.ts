export type ExecutiveParticipantKind =
  | "human"
  | "chief-agent"
  | "specialist-agent"
  | "observer"
  | "system";

export type ExecutiveParticipantRole =
  | "executive"
  | "chief-agent"
  | "advisor"
  | "specialist"
  | "observer"
  | "facilitator"
  | "system";

export interface ExecutiveParticipant {
  id: string;

  role:
    ExecutiveParticipantRole;

  displayName: string;

  kind:
    ExecutiveParticipantKind;

  joinedAt: number;

  metadata:
    Readonly<
      Record<string, unknown>
    >;
}

export interface CreateExecutiveParticipantInput {
  id: string;

  role:
    ExecutiveParticipantRole;

  displayName: string;

  kind:
    ExecutiveParticipantKind;

  joinedAt?: number;

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

function assertNonEmptyParticipantField(
  value: string,
  fieldName: string,
): void {
  if (
    value.trim().length === 0
  ) {
    throw new Error(
      `Executive participant ${fieldName} must not be empty.`,
    );
  }
}

export function createExecutiveParticipant(
  input:
    CreateExecutiveParticipantInput,
): ExecutiveParticipant {
  assertNonEmptyParticipantField(
    input.id,
    "id",
  );

  assertNonEmptyParticipantField(
    input.displayName,
    "display name",
  );

  return Object.freeze({
    id:
      input.id.trim(),

    role:
      input.role,

    displayName:
      input.displayName.trim(),

    kind:
      input.kind,

    joinedAt:
      input.joinedAt ??
      Date.now(),

    metadata:
      Object.freeze({
        ...(input.metadata ?? {}),
      }),
  });
}

export function isHumanExecutiveParticipant(
  participant:
    ExecutiveParticipant,
): boolean {
  return (
    participant.kind ===
      "human" &&
    participant.role ===
      "executive"
  );
}

export function isChiefAgentParticipant(
  participant:
    ExecutiveParticipant,
): boolean {
  return (
    participant.kind ===
      "chief-agent" &&
    participant.role ===
      "chief-agent"
  );
}
