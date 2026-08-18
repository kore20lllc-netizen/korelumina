export type ExecutiveConstitutionRuleSeverity =
  | "advisory"
  | "required"
  | "absolute";

export interface ExecutiveConstitutionRule {
  id: string;

  principle: string;

  description: string;

  severity: ExecutiveConstitutionRuleSeverity;

  enabled: boolean;
}

export interface ExecutiveConstitution {
  version: string;

  rules: readonly ExecutiveConstitutionRule[];
}

export interface ExecutiveConstitutionFinding {
  ruleId: string;

  severity: ExecutiveConstitutionRuleSeverity;

  message: string;
}

export interface ExecutiveConstitutionEvaluation {
  valid: boolean;

  evaluatedRuleIds: string[];

  findings: ExecutiveConstitutionFinding[];
}

export interface ExecutiveConstitutionProposal {
  statement: string;

  evidence?: readonly string[];

  metadata?: Readonly<
    Record<string, unknown>
  >;
}

export type ExecutiveConstitutionEvaluator = (
  proposal: ExecutiveConstitutionProposal,
  rule: ExecutiveConstitutionRule,
) => ExecutiveConstitutionFinding | null;

export const koreLuminaExecutiveConstitution: ExecutiveConstitution = {
  version: "1.0.0",

  rules: [
    {
      id: "documentation-authority",
      principle:
        "Documentation is the source of truth.",
      description:
        "Executive recommendations must reconcile with authoritative KoreLumina documentation.",
      severity: "absolute",
      enabled: true,
    },
    {
      id: "ui-contract",
      principle:
        "UI is the system contract.",
      description:
        "Backend and runtime behavior must conform to the finalized production UI contract.",
      severity: "absolute",
      enabled: true,
    },
    {
      id: "runtime-authority",
      principle:
        "Runtime is the operational source of truth.",
      description:
        "Operational state must originate from runtime systems rather than fabricated client state.",
      severity: "absolute",
      enabled: true,
    },
    {
      id: "architecture-preservation",
      principle:
        "Preserve architecture before extending it.",
      description:
        "Existing architecture must be inspected and reconciled before new domains are introduced.",
      severity: "required",
      enabled: true,
    },
    {
      id: "reconciliation-before-replacement",
      principle:
        "Prefer reconciliation over replacement.",
      description:
        "Established systems should be composed and extended rather than duplicated.",
      severity: "required",
      enabled: true,
    },
    {
      id: "evidence-required",
      principle:
        "Significant decisions require evidence.",
      description:
        "Material recommendations and decisions must retain traceable supporting evidence.",
      severity: "required",
      enabled: true,
    },
    {
      id: "human-authority",
      principle:
        "Human executive authority remains final.",
      description:
        "The Chief Agent may advise, coordinate, and propose but must preserve human approval authority.",
      severity: "absolute",
      enabled: true,
    },
  ],
};

export function evaluateExecutiveProposal(
  constitution: ExecutiveConstitution,
  proposal: ExecutiveConstitutionProposal,
  evaluator: ExecutiveConstitutionEvaluator,
): ExecutiveConstitutionEvaluation {
  const activeRules =
    constitution.rules.filter(
      (rule) => rule.enabled,
    );

  const findings =
    activeRules.flatMap(
      (rule) => {
        const finding =
          evaluator(
            proposal,
            rule,
          );

        return finding
          ? [finding]
          : [];
      },
    );

  const invalid =
    findings.some(
      (finding) =>
        finding.severity ===
          "absolute" ||
        finding.severity ===
          "required",
    );

  return {
    valid: !invalid,

    evaluatedRuleIds:
      activeRules.map(
        (rule) => rule.id,
      ),

    findings,
  };
}
