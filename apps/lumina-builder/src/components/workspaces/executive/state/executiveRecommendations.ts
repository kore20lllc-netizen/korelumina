import { missionTasks } from "./missionView";
import type { ExecutiveOfficeState } from "./useExecutiveOffice";

/*
 * MS-2026-0004 (E1.T2): what needs the owner, derived by fixed rules from
 * the Runtime records the office reads. Every recommendation names the
 * record it comes from, so it can be checked; none is generated or guessed.
 * They are ordered by what blocks the most: decisions first, then missions
 * one step from done, then work to start, then housekeeping.
 */

export interface Recommendation {
  key: string;
  title: string;
  reason: string;
  impact: string;
  source: string;
}

const MAX = 5;

function ago(at: number, now: number): string {
  const hours = Math.max(0, Math.round((now - at) / 3_600_000));
  if (hours < 1) return "under an hour ago";
  return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
}

export function deriveRecommendations(office: ExecutiveOfficeState, now = Date.now()): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const missions = office.missions.status === "ok" ? office.missions.data : [];
  const approvals = office.operations.status === "ok" ? office.operations.data.approvals : [];

  for (const approval of approvals.filter((entry) => entry.status === "pending")) {
    recommendations.push({
      key: `approval:${approval.id}`,
      title: `Decide: ${approval.metadata?.decisionTitle ?? approval.decisionId}`,
      reason: `The Chief Agent proposed it ${ago(approval.createdAt, now)}; nothing it proposes takes effect until you decide.`,
      impact: "Decided in the Approval Center",
      source: approval.id,
    });
  }

  if (office.prerequisites.status === "ok") {
    const invalid = office.prerequisites.data.filter((entry) => entry.state !== "VALID");
    if (invalid.length) {
      recommendations.push({
        key: "prerequisites",
        title: "Restore the Chief Agent's activation certifications",
        reason: `${invalid.map((entry) => `${entry.gate} is ${entry.state.toLowerCase()}`).join("; ")}. Resume is refused until all are valid.`,
        impact: "Activation stays verifiable",
        source: "activation prerequisites",
      });
    }
  }

  for (const mission of missions.filter((entry) => entry.state === "validating")) {
    const failing = mission.checks?.filter((check) => !check.passed) ?? [];
    const onlyBuild = failing.length === 1 && failing[0].id === "build";
    recommendations.push({
      key: `validate:${mission.id}`,
      title: onlyBuild ? `Record the build for ${mission.id}` : `Finish validating ${mission.id}`,
      reason: onlyBuild
        ? `Every other check passed. The last evidence is npm run build at ${mission.recoveryAnchor?.slice(0, 8)}: record it in the Execution Center.`
        : `Still failing: ${failing.map((check) => check.label.toLowerCase()).join("; ") || "checks not read yet"}.`,
      impact: `${mission.title} completes`,
      source: mission.id,
    });
  }

  for (const mission of missions.filter((entry) => entry.state === "executing")) {
    const open = missionTasks(mission).filter((task) => task.status === "todo");
    if (!open.length) continue;
    recommendations.push({
      key: `tasks:${mission.id}`,
      title: `${open.length} task${open.length === 1 ? "" : "s"} open in ${mission.id}`,
      reason: `${mission.linkedCommits.length} commit${mission.linkedCommits.length === 1 ? "" : "s"} linked so far. Mark finished tasks done in Planning, or drop them with a reason.`,
      impact: `${mission.title} moves to validation`,
      source: mission.id,
    });
  }

  for (const mission of missions.filter((entry) => entry.state === "approved" && entry.linkedCommits.length === 0)) {
    const approvedAt = [...mission.history].reverse().find((step) => step.to === "approved")?.at ?? mission.updatedAt;
    recommendations.push({
      key: `start:${mission.id}`,
      title: `Start ${mission.id}: ${mission.title}`,
      reason: `Approved ${ago(approvedAt, now)}. It starts with the first commit carrying Mission: ${mission.id}.`,
      impact: "Execution begins",
      source: mission.id,
    });
  }

  for (const mission of missions.filter((entry) => entry.state === "planned" && entry.proposedBy.type === "human")) {
    recommendations.push({
      key: `plan:${mission.id}`,
      title: `Submit or cancel ${mission.id}`,
      reason: "It is planned but waiting for your approval to start.",
      impact: "The mission list reflects what you intend",
      source: mission.id,
    });
  }

  if (office.canonicalReviews.status === "ok") {
    for (const review of office.canonicalReviews.data) {
      recommendations.push({
        key: `review:${review.id}`,
        title: `Review ${review.title}`,
        reason: `Waiting for canonical review since ${ago(review.createdAt, now)}.`,
        impact: "Becomes canonical knowledge the Chief Agent reasons with",
        source: review.id,
      });
    }
  }

  if (office.learning.status === "ok") {
    const learning = office.learning.data;
    if (learning.nonOwnerPendingCommits.length) {
      recommendations.push({
        key: "learning:held",
        title: `Learning is held by ${learning.nonOwnerPendingCommits.length} non-owner commit${learning.nonOwnerPendingCommits.length === 1 ? "" : "s"}`,
        reason: "Continuous learning only learns from owner commits (ADR-0042); these hold the window.",
        impact: "Learning resumes",
        source: "learning checkpoint",
      });
    } else if (learning.pendingCommits.length && !learning.running) {
      recommendations.push({
        key: "learning:pending",
        title: `Learn from ${learning.pendingCommits.length} new commit${learning.pendingCommits.length === 1 ? "" : "s"}`,
        reason: "They are not learned yet. Learn now, or wait for the next automatic check.",
        impact: "Missions link their commits and a Learning Record is written",
        source: "learning checkpoint",
      });
    }
  }

  const uncommitted = office.platform.status === "ok" ? office.platform.data.uncommittedRecords : null;
  if (uncommitted && uncommitted.learningRecords + uncommitted.runtimeRecords > 0) {
    recommendations.push({
      key: "records:uncommitted",
      title: "Commit the records that have built up",
      reason: `${uncommitted.learningRecords} Learning Record${uncommitted.learningRecords === 1 ? "" : "s"} and ${uncommitted.runtimeRecords} Runtime record${uncommitted.runtimeRecords === 1 ? "" : "s"} exist only on this machine.`,
      impact: "They survive machine loss (MS-2026-0007)",
      source: "git status",
    });
  }

  return recommendations.slice(0, MAX);
}
