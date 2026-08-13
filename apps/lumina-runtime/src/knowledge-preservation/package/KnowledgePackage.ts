import type {
  KnowledgeIRCompilerMetadata,
  KnowledgeIRItem,
  KnowledgeIRStatus,
} from "../ir/index.js";

export type KnowledgePackageLifecycleState =
  | "captured"
  | "compiled"
  | "validated"
  | "awaiting_review"
  | "approved"
  | "rejected"
  | "canonical"
  | "adapted"
  | "consumed"
  | "superseded"
  | "archived";

export type KnowledgePackageApprovalState =
  | "pending_review"
  | "approved"
  | "rejected"
  | "remediation_required";

export type KnowledgePackageRemediationStatus =
  | "not_required"
  | "required"
  | "in_progress"
  | "resolved";

export interface KnowledgePackageLifecycleEvent {
  state:
    KnowledgePackageLifecycleState;

  at:
    number;

  reason?:
    string;
}

export interface KnowledgePackageCompilerHistoryEntry {
  itemId:
    string;

  compiler:
    KnowledgeIRCompilerMetadata;
}

export interface KnowledgePackageValidationResult {
  itemId:
    string;

  status:
    KnowledgeIRStatus;

  confidence:
    number;

  blocked:
    boolean;

  details:
    Record<string, unknown>;
}

export interface KnowledgePackageProvenance {
  evidenceIds:
    string[];

  sourceLocations:
    string[];

  contentRefs:
    string[];

  sources:
    string[];
}

export interface KnowledgePackageSupersession {
  supersedes:
    string[];

  supersededBy:
    string[];
}

export interface KnowledgePackageRemediation {
  required:
    boolean;

  status:
    KnowledgePackageRemediationStatus;

  blockedItemIds:
    string[];

  updatedAt:
    number;
}

export interface KnowledgePackage {
  id:
    string;

  state:
    KnowledgePackageLifecycleState;

  sourceEvidenceRefs:
    string[];

  knowledgeItemIds:
    string[];

  items:
    KnowledgeIRItem[];

  provenance:
    KnowledgePackageProvenance;

  authority:
    string | null;

  approvalState:
    KnowledgePackageApprovalState;

  owner:
    string | null;

  scope:
    string | null;

  version:
    string | null;

  confidence:
    number;

  dependencies:
    string[];

  lineage:
    string[];

  supersession:
    KnowledgePackageSupersession;

  destination:
    string | null;

  validationResults:
    KnowledgePackageValidationResult[];

  compilerHistory:
    KnowledgePackageCompilerHistoryEntry[];

  lifecycleHistory:
    KnowledgePackageLifecycleEvent[];

  remediation:
    KnowledgePackageRemediation;

  createdAt:
    number;

  updatedAt:
    number;

  metadata:
    Record<string, unknown>;
}

function stringArray(
  value: unknown,
): string[] {
  if (
    !Array.isArray(
      value,
    )
  ) {
    return [];
  }

  return value.filter(
    (
      item,
    ): item is string =>
      typeof item ===
        "string" &&
      item.trim().length >
        0,
  );
}

function metadataString(
  value: unknown,
): string | null {
  return typeof value ===
      "string" &&
    value.trim().length >
      0
    ? value
    : null;
}

export function normalizeKnowledgePackage(
  knowledgePackage:
    KnowledgePackage,
): KnowledgePackage {
  const now =
    knowledgePackage.updatedAt ??
    knowledgePackage.createdAt ??
    Date.now();

  const items =
    Array.isArray(
      knowledgePackage.items,
    )
      ? knowledgePackage.items
      : [];

  const sourceEvidenceRefs =
    Array.isArray(
      knowledgePackage.sourceEvidenceRefs,
    )
      ? knowledgePackage.sourceEvidenceRefs
      : [
          ...new Set(
            items.flatMap(
              (item) =>
                item.evidenceRefs,
            ),
          ),
        ];

  const blockedItemIds =
    items
      .filter(
        (item) =>
          item.status ===
            "rejected" ||
          item.status ===
            "needs-review",
      )
      .map(
        (item) =>
          item.id,
      );

  return {
    ...knowledgePackage,

    sourceEvidenceRefs,

    knowledgeItemIds:
      Array.isArray(
        knowledgePackage.knowledgeItemIds,
      )
        ? knowledgePackage.knowledgeItemIds
        : items.map(
            (item) =>
              item.id,
          ),

    items,

    provenance:
      knowledgePackage.provenance ?? {
        evidenceIds:
          sourceEvidenceRefs,

        sourceLocations:
          items.flatMap(
            (item) =>
              stringArray(
                item.metadata
                  .sourceLocation,
              ),
          ),

        contentRefs:
          items
            .map(
              (item) =>
                metadataString(
                  item.metadata
                    .contentRef,
                ),
            )
            .filter(
              (
                value,
              ): value is string =>
                value !== null,
            ),

        sources:
          items
            .map(
              (item) =>
                metadataString(
                  item.metadata
                    .source,
                ),
            )
            .filter(
              (
                value,
              ): value is string =>
                value !== null,
            ),
      },

    authority:
      knowledgePackage.authority ??
      null,

    approvalState:
      knowledgePackage.approvalState ??
      (
        blockedItemIds.length >
        0
          ? "remediation_required"
          : "pending_review"
      ),

    owner:
      knowledgePackage.owner ??
      null,

    scope:
      knowledgePackage.scope ??
      null,

    version:
      knowledgePackage.version ??
      null,

    confidence:
      typeof knowledgePackage.confidence ===
        "number"
        ? knowledgePackage.confidence
        : (
            items.length > 0
              ? items.reduce(
                  (
                    total,
                    item,
                  ) =>
                    total +
                    item.confidence,
                  0,
                ) /
                items.length
              : 0
          ),

    dependencies:
      Array.isArray(
        knowledgePackage.dependencies,
      )
        ? knowledgePackage.dependencies
        : [],

    lineage:
      Array.isArray(
        knowledgePackage.lineage,
      )
        ? knowledgePackage.lineage
        : [],

    supersession:
      knowledgePackage.supersession ?? {
        supersedes:
          [],

        supersededBy:
          [],
      },

    destination:
      knowledgePackage.destination ??
      null,

    validationResults:
      Array.isArray(
        knowledgePackage.validationResults,
      )
        ? knowledgePackage.validationResults
        : items.map(
            (item) => ({
              itemId:
                item.id,

              status:
                item.status,

              confidence:
                item.confidence,

              blocked:
                item.status ===
                  "rejected" ||
                item.status ===
                  "needs-review",

              details:
                typeof item.metadata
                    .validation ===
                  "object" &&
                item.metadata
                    .validation !==
                  null
                  ? {
                      ...(
                        item.metadata
                          .validation as
                          Record<
                            string,
                            unknown
                          >
                      ),
                    }
                  : {},
            }),
          ),

    compilerHistory:
      Array.isArray(
        knowledgePackage.compilerHistory,
      )
        ? knowledgePackage.compilerHistory
        : items.map(
            (item) => ({
              itemId:
                item.id,

              compiler:
                item.compiler,
            }),
          ),

    lifecycleHistory:
      Array.isArray(
        knowledgePackage.lifecycleHistory,
      )
        ? knowledgePackage.lifecycleHistory
        : [
            {
              state:
                knowledgePackage.state,

              at:
                knowledgePackage.createdAt,
            },
          ],

    remediation:
      knowledgePackage.remediation ?? {
        required:
          blockedItemIds.length >
          0,

        status:
          blockedItemIds.length >
          0
            ? "required"
            : "not_required",

        blockedItemIds,

        updatedAt:
          now,
      },

    metadata:
      knowledgePackage.metadata ?? {},
  };
}
