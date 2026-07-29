export type ExecutiveInvariantSeverity =
  | "advisory"
  | "required"
  | "critical";

export type ExecutiveAuthoritySourceKind =
  | "genesis"
  | "constitution"
  | "architecture"
  | "documentation"
  | "runtime"
  | "knowledge"
  | "governance"
  | "human-directive"
  | "evidence";

export interface ExecutiveInvariant {
  id: string;
  title: string;
  statement: string;
  severity: ExecutiveInvariantSeverity;
  requiredSourceKinds: readonly ExecutiveAuthoritySourceKind[];
  tags: readonly string[];
}

export const KORELUMINA_EXECUTIVE_INVARIANTS: readonly ExecutiveInvariant[] = [
  {
    id: "preserve-organizational-intent",
    title: "Preserve organizational intent",
    statement:
      "Every executive action must preserve KoreLumina's documented organizational intent.",
    severity: "critical",
    requiredSourceKinds: [
      "constitution",
      "documentation",
    ],
    tags: [
      "north-star",
      "identity",
      "continuity",
    ],
  },

  {
    id: "documentation-is-authoritative",
    title: "Documentation is authoritative",
    statement:
      "Documented architecture and governance take precedence over unsupported inference.",
    severity: "critical",
    requiredSourceKinds: [
      "documentation",
    ],
    tags: [
      "knowledge",
      "architecture",
    ],
  },

  {
    id: "ui-is-the-contract",
    title: "UI is the contract",
    statement:
      "Production workspace UI is finalized before backend constraints shape its contract.",
    severity: "required",
    requiredSourceKinds: [
      "architecture",
      "documentation",
    ],
    tags: [
      "ui",
      "implementation-order",
    ],
  },

  {
    id: "runtime-is-operational-truth",
    title: "Runtime is operational truth",
    statement:
      "Operational state must come from verified runtime data and must never be fabricated.",
    severity: "critical",
    requiredSourceKinds: [
      "runtime",
    ],
    tags: [
      "runtime",
      "evidence",
    ],
  },

  {
    id: "reconcile-before-replace",
    title: "Reconcile before replacement",
    statement:
      "Existing architecture must be reconciled and extended before replacement is proposed.",
    severity: "required",
    requiredSourceKinds: [
      "architecture",
      "documentation",
    ],
    tags: [
      "architecture",
      "continuity",
    ],
  },

  {
    id: "human-authority-is-final",
    title: "Human executive authority is final",
    statement:
      "Actions requiring executive approval must not execute without explicit human authorization.",
    severity: "critical",
    requiredSourceKinds: [
      "human-directive",
      "governance",
    ],
    tags: [
      "approval",
      "governance",
    ],
  },
];
