import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

import {
  canonicalEducationEvidenceRefs,
  canonicalEducationUpdatedAt,
} from "../normalization/index.js";

import {
  educationalStatus,
} from "./EducationalArtifactProjector.js";

export interface EducationalTimelineProjection {
  id:
    string;

  date:
    string;

  label:
    string;

  type:
    | "recovery"
    | "admission"
    | "approval"
    | "version"
    | "supersession"
    | "completion"
    | "dependency"
    | "competency"
    | "review"
    | "conversation";

  status:
    | "completed"
    | "active"
    | "blocked"
    | "not-started"
    | "needs-review";

  provenance:
    string;

  artifactIds:
    string[];

  description:
    string;
}

function timelineType(
  item:
    CanonicalKnowledgeItem,
): EducationalTimelineProjection["type"] {
  switch (
    item.status
  ) {
    case "canonical":
      return "admission";

    case "superseded":
      return "supersession";

    default:
      return "review";
  }
}

export function projectEducationalTimelineEvent(
  item:
    CanonicalKnowledgeItem,
): EducationalTimelineProjection {
  const evidenceRefs =
    canonicalEducationEvidenceRefs(
      item,
    );

  const updatedAt =
    canonicalEducationUpdatedAt(
      item,
    );

  return {
    id:
      `education:canonical:${item.id}`,

    date:
      new Date(
        updatedAt ||
        Date.now(),
      ).toISOString(),

    label:
      typeof item.title ===
        "string"
        ? item.title
        : "Untitled canonical knowledge",

    type:
      timelineType(
        item,
      ),

    status:
      educationalStatus(
        item,
      ),

    provenance:
      evidenceRefs.length >
        0
        ? evidenceRefs.join(
            ", ",
          )
        : "Canonical Knowledge",

    artifactIds: [
      item.id,
    ],

    description:
      typeof item.summary ===
        "string"
        ? item.summary
        : "",
  };
}

export function projectEducationalTimeline(
  items:
    readonly CanonicalKnowledgeItem[],
): EducationalTimelineProjection[] {
  return items.map(
    projectEducationalTimelineEvent,
  );
}
