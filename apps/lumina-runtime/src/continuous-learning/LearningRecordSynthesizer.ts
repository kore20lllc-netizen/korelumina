import type { TextGenerationClient } from "../ai/model/index.js";
import type { LearningEvidence } from "./LearningEvidence.js";

/*
 * ADR-0042 (CL-1c): the Chief Agent writes one Learning Record for a
 * window, and the Runtime checks it mechanically before anything is kept
 * (Decision 3, steps 2 and 3).
 */

export type LearningSectionName =
  | "changes"
  | "decisions"
  | "lessons"
  | "risks";

export interface LearningStatement {
  statement: string;
  citations: readonly string[];
}

export interface LearningRecordDraft {
  title: string;
  summary: string;
  changes: readonly LearningStatement[];
  decisions: readonly LearningStatement[];
  lessons: readonly LearningStatement[];
  risks: readonly LearningStatement[];
  conflictsWithGoverningKnowledge: boolean;
  conflictNotes: string;
  confidence: number;
}

export interface LearningRecordCheck {
  passed: boolean;
  reasons: readonly string[];
  removedStatements: number;
  keptStatements: number;
  record: LearningRecordDraft;
  model: string;
}

const SECTIONS: readonly LearningSectionName[] = [
  "changes",
  "decisions",
  "lessons",
  "risks",
];

function buildPrompt(evidence: LearningEvidence): string {
  return [
    "You are the KoreLumina Chief Agent. Write a Learning Record: what the organization should remember from the engineering work below.",
    "",
    "Rules:",
    "- Use only the evidence below. Do not invent facts, people, numbers, or outcomes.",
    "- Every statement must cite at least one source: a full commit SHA, a file path, or an executive record ID, exactly as written below.",
    "- changes: what was built or changed, and why.",
    "- decisions: decisions made and their reasons (ADRs, approvals, choices between options).",
    "- lessons: what went wrong or right and should be done the same or differently next time (mistakes, reverts, fixes, surprises).",
    "- risks: open problems or follow-ups the work left behind.",
    "- Be specific and short. One fact per statement. No marketing language.",
    "- If any of this work contradicts governing knowledge (Canon, Constitution, Blueprint, governance rules), set conflictsWithGoverningKnowledge to true and explain.",
    "",
    "Return JSON only, no markdown:",
    "{",
    '  "title": "short title for this body of work",',
    '  "summary": "two or three sentences",',
    '  "changes": [{"statement": "...", "citations": ["..."]}],',
    '  "decisions": [{"statement": "...", "citations": ["..."]}],',
    '  "lessons": [{"statement": "...", "citations": ["..."]}],',
    '  "risks": [{"statement": "...", "citations": ["..."]}],',
    '  "conflictsWithGoverningKnowledge": false,',
    '  "conflictNotes": "",',
    '  "confidence": 0.0',
    "}",
    "",
    `Window: ${evidence.fromCommit}..${evidence.toCommit}`,
    "",
    "Commits:",
    ...evidence.commits.map((commit) =>
      [
        `--- commit ${commit.sha} (${new Date(commit.committedAt).toISOString()})`,
        commit.detail.trim(),
      ].join("\n"),
    ),
    "",
    "Executive records in the window:",
    evidence.executiveRecords.length === 0
      ? "(none)"
      : evidence.executiveRecords
          .map(
            (record) =>
              `- ${record.id} (${record.kind}, ${record.status}): ${record.title}`,
          )
          .join("\n"),
  ].join("\n");
}

function stripFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

function statements(value: unknown): LearningStatement[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      statement:
        typeof (entry as { statement?: unknown })?.statement === "string"
          ? (entry as { statement: string }).statement.trim()
          : "",
      citations: Array.isArray((entry as { citations?: unknown })?.citations)
        ? ((entry as { citations: unknown[] }).citations.filter(
            (citation) => typeof citation === "string",
          ) as string[]).map((citation) => citation.trim())
        : [],
    }))
    .filter((entry) => entry.statement.length > 0);
}

export function parseLearningRecordDraft(text: string): LearningRecordDraft {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripFence(text)) as Record<string, unknown>;
  } catch {
    throw new Error("learning_record_invalid_json");
  }
  const confidence = Number(parsed.confidence);
  return {
    title: typeof parsed.title === "string" ? parsed.title.trim() : "",
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "",
    changes: statements(parsed.changes),
    decisions: statements(parsed.decisions),
    lessons: statements(parsed.lessons),
    risks: statements(parsed.risks),
    conflictsWithGoverningKnowledge:
      parsed.conflictsWithGoverningKnowledge === true,
    conflictNotes:
      typeof parsed.conflictNotes === "string" ? parsed.conflictNotes.trim() : "",
    confidence: Number.isFinite(confidence) ? confidence : 0,
  };
}

/*
 * The citable sources of a window. A commit may be cited by its full SHA
 * or by an unambiguous prefix of at least 7 characters; it is normalised
 * to the full SHA.
 */
export function createCitationResolver(evidence: LearningEvidence) {
  const shas = evidence.commits.map((commit) => commit.sha);
  const files = new Set(evidence.changedFiles);
  const records = new Set(evidence.executiveRecords.map((record) => record.id));

  return (citation: string): string | null => {
    const value = citation.trim().replace(/^`|`$/g, "");
    if (files.has(value) || records.has(value)) return value;
    if (/^[0-9a-f]{7,40}$/i.test(value)) {
      const matches = shas.filter((sha) => sha.startsWith(value.toLowerCase()));
      return matches.length === 1 ? matches[0] : null;
    }
    return null;
  };
}

export function checkLearningRecord(
  draft: LearningRecordDraft,
  evidence: LearningEvidence,
  confidenceThreshold: number,
): Omit<LearningRecordCheck, "model"> {
  const resolve = createCitationResolver(evidence);
  let removed = 0;
  let kept = 0;
  const cleaned: Record<LearningSectionName, LearningStatement[]> = {
    changes: [],
    decisions: [],
    lessons: [],
    risks: [],
  };

  for (const section of SECTIONS) {
    for (const entry of draft[section]) {
      const citations = [
        ...new Set(
          entry.citations
            .map(resolve)
            .filter((value): value is string => value !== null),
        ),
      ];
      if (citations.length === 0) {
        removed += 1;
        continue;
      }
      kept += 1;
      cleaned[section].push({ statement: entry.statement, citations });
    }
  }

  const reasons: string[] = [];
  if (draft.conflictsWithGoverningKnowledge) {
    reasons.push(
      `conflict_with_governing_knowledge:${draft.conflictNotes || "unspecified"}`,
    );
  }
  if (draft.confidence < confidenceThreshold) {
    reasons.push(
      `confidence_below_threshold:${draft.confidence}<${confidenceThreshold}`,
    );
  }
  if (kept === 0) {
    reasons.push("no_cited_statements");
  }
  if (!draft.title) {
    reasons.push("title_missing");
  }

  return {
    passed: reasons.length === 0,
    reasons,
    removedStatements: removed,
    keptStatements: kept,
    record: { ...draft, ...cleaned },
  };
}

export class LearningRecordSynthesizer {
  constructor(
    private readonly client: TextGenerationClient,
    private readonly confidenceThreshold = 0.6,
  ) {}

  async synthesize(evidence: LearningEvidence): Promise<LearningRecordCheck> {
    const generated = await this.client.generateText({
      prompt: buildPrompt(evidence),
    });
    const draft = parseLearningRecordDraft(generated.text);
    return {
      ...checkLearningRecord(draft, evidence, this.confidenceThreshold),
      model: generated.model,
    };
  }
}
