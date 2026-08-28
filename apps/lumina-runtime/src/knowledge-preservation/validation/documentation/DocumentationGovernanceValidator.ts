import type {
  KnowledgeIRItem,
} from "../../ir/index.js";

import type {
  KnowledgeValidator,
} from "../KnowledgeValidator.js";

interface ValidationIssue {
  code:
    string;

  field:
    string;

  message:
    string;
}

function metadataString(
  item:
    KnowledgeIRItem,

  key:
    string,
): string {
  const value =
    item.metadata[
      key
    ];

  return typeof value ===
      "string"
    ? value.trim()
    : "";
}

function metadataStringArray(
  item:
    KnowledgeIRItem,

  key:
    string,
): string[] {
  const value =
    item.metadata[
      key
    ];

  if (
    typeof value ===
      "string"
  ) {
    return value.trim()
      ? [
          value.trim(),
        ]
      : [];
  }

  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value.filter(
    (
      entry,
    ): entry is string =>
      typeof entry ===
        "string" &&
      entry.trim().length >
        0,
  );
}

function requiredStringIssue(
  item:
    KnowledgeIRItem,

  key:
    string,

  code:
    string,
): ValidationIssue | null {
  return metadataString(
    item,
    key,
  )
    ? null
    : {
        code,

        field:
          key,

        message:
          `Documentation governance metadata "${key}" is required.`,
      };
}

export class DocumentationGovernanceValidator
  implements KnowledgeValidator
{
  readonly name =
    "documentation-governance-validator";

  readonly version =
    "1.0.0";

  supports(
    item:
      KnowledgeIRItem,
  ): boolean {
    return (
      item.compiler
        .compilerName ===
      "documentation-compiler"
    );
  }

  async validate(
    item:
      KnowledgeIRItem,
  ): Promise<KnowledgeIRItem> {
    if (
      !this.supports(
        item,
      )
    ) {
      return item;
    }

    const issues:
      ValidationIssue[] = [];

    const required = [
      [
        "source",
        "documentation_source_required",
      ],
      [
        "contentRef",
        "documentation_content_ref_required",
      ],
      [
        "authorityClass",
        "documentation_authority_required",
      ],
      [
        "approvalState",
        "documentation_approval_state_required",
      ],
      [
        "owner",
        "documentation_owner_required",
      ],
      [
        "scope",
        "documentation_scope_required",
      ],
      [
        "version",
        "documentation_version_required",
      ],
      [
        "sourceLocation",
        "documentation_source_location_required",
      ],
    ] as const;

    for (
      const [
        field,
        code,
      ]
      of required
    ) {
      const issue =
        requiredStringIssue(
          item,
          field,
          code,
        );

      if (
        issue
      ) {
        issues.push(
          issue,
        );
      }
    }

    const approvalState =
      metadataString(
        item,
        "approvalState",
      )
        .toLowerCase();

    if (
      approvalState !==
        "approved"
    ) {
      issues.push({
        code:
          "documentation_source_not_approved",

        field:
          "approvalState",

        message:
          "Documentation source must be explicitly approved before it may enter Canonical Review.",
      });
    }

    if (
      item.evidenceRefs.length ===
      0
    ) {
      issues.push({
        code:
          "documentation_evidence_required",

        field:
          "evidenceRefs",

        message:
          "Documentation IR must preserve at least one evidence reference.",
      });
    }

    const lineage =
      metadataStringArray(
        item,
        "lineage",
      );

    const dependencies =
      metadataStringArray(
        item,
        "dependencies",
      );

    const passed =
      issues.length ===
      0;

    return {
      ...item,

      status:
        passed
          ? "approved"
          : "needs-review",

      metadata: {
        ...item.metadata,

        lineage,

        dependencies,

        validation: {
          validator:
            this.name,

          validatorVersion:
            this.version,

          result:
            passed
              ? "passed"
              : "failed",

          checkedAt:
            Date.now(),

          issues,
        },
      },
    };
  }
}
