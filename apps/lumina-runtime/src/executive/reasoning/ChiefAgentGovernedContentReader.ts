import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  CanonicalKnowledgeItem,
} from "../../canonical-knowledge/index.js";

/*
 * KO-6 (F-22): give Chief Agent reasoning the certified content of
 * canonical knowledge, not only its title and one-line summary.
 *
 * A canonical item records the repository file it came from (contentRef)
 * and that file's checksum at certification. Content is included only when
 * the file still has exactly that checksum, so the Chief Agent reads the
 * governed version and never an unreviewed edit. Everything left out is
 * listed with its reason, and the result is recorded with the reasoning.
 */

export interface GovernedContentEntry {
  id: string;
  contentRef: string;
  content: string;
  truncated: boolean;
}

export interface GovernedContentExclusion {
  id: string;
  reason:
    | "content_ref_not_a_repository_file"
    | "content_missing"
    | "content_checksum_missing"
    | "content_changed_since_certification"
    | "context_budget_reached";
}

export interface ChiefAgentGovernedContent {
  included: readonly GovernedContentEntry[];
  excluded: readonly GovernedContentExclusion[];
}

export interface ChiefAgentGovernedContentReaderOptions {
  maxItemChars?: number;
  maxTotalChars?: number;
}

const DEFAULT_MAX_ITEM_CHARS = 8_000;
const DEFAULT_MAX_TOTAL_CHARS = 60_000;

function queryTerms(
  query: string | undefined,
): string[] {
  return [
    ...new Set(
      (query ?? "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length >= 4),
    ),
  ];
}

function readMetadataString(
  item: CanonicalKnowledgeItem,
  key: string,
): string | null {
  const value = (
    item.metadata as Record<string, unknown> | undefined
  )?.[key];
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

export class ChiefAgentGovernedContentReader {
  private readonly root: string;
  private readonly maxItemChars: number;
  private readonly maxTotalChars: number;

  constructor(
    repositoryRoot: string,
    options: ChiefAgentGovernedContentReaderOptions = {},
  ) {
    this.root = path.resolve(repositoryRoot);
    this.maxItemChars =
      options.maxItemChars ?? DEFAULT_MAX_ITEM_CHARS;
    this.maxTotalChars =
      options.maxTotalChars ?? DEFAULT_MAX_TOTAL_CHARS;
  }

  read(
    items: readonly CanonicalKnowledgeItem[],
    query?: string,
  ): ChiefAgentGovernedContent {
    const excluded: GovernedContentExclusion[] = [];
    const candidates: Array<{
      id: string;
      contentRef: string;
      content: string;
      score: number;
      order: number;
    }> = [];

    items.forEach((item, order) => {
      const contentRef = readMetadataString(item, "contentRef");
      if (!contentRef) {
        return;
      }

      if (
        contentRef.includes("#") ||
        path.isAbsolute(contentRef)
      ) {
        excluded.push({
          id: item.id,
          reason: "content_ref_not_a_repository_file",
        });
        return;
      }

      const filePath = path.resolve(this.root, contentRef);
      if (
        filePath !== this.root &&
        !filePath.startsWith(`${this.root}${path.sep}`)
      ) {
        excluded.push({
          id: item.id,
          reason: "content_ref_not_a_repository_file",
        });
        return;
      }

      let bytes: Buffer;
      try {
        bytes = fs.readFileSync(filePath);
      } catch {
        excluded.push({ id: item.id, reason: "content_missing" });
        return;
      }

      const checksum = readMetadataString(item, "checksum");
      if (!checksum) {
        excluded.push({
          id: item.id,
          reason: "content_checksum_missing",
        });
        return;
      }

      const actual = `sha256:${crypto
        .createHash("sha256")
        .update(bytes)
        .digest("hex")}`;

      if (actual !== checksum) {
        excluded.push({
          id: item.id,
          reason: "content_changed_since_certification",
        });
        return;
      }

      candidates.push({
        id: item.id,
        contentRef,
        content: bytes.toString("utf8"),
        score: 0,
        order,
      });
    });

    /*
     * BM25 relevance to the question: words that appear in most documents
     * (for example "knowledge") count for little, rare ones (for example
     * "customer") for a lot, and long documents are not favoured for
     * length alone.
     */
    const terms = queryTerms(query);
    const tokenized = candidates.map((candidate) =>
      candidate.content.toLowerCase().split(/[^a-z0-9]+/),
    );
    const averageLength =
      tokenized.reduce((sum, tokens) => sum + tokens.length, 0) /
      Math.max(tokenized.length, 1);

    const documentFrequency = new Map<string, number>();
    for (const term of terms) {
      documentFrequency.set(
        term,
        tokenized.filter((tokens) =>
          tokens.some((token) => token.startsWith(term)),
        ).length,
      );
    }

    candidates.forEach((candidate, index) => {
      const tokens = tokenized[index];
      let score = 0;
      for (const term of terms) {
        const frequency = tokens.filter((token) =>
          token.startsWith(term),
        ).length;
        if (frequency === 0) continue;
        const df = documentFrequency.get(term) ?? 0;
        const idf = Math.log(
          1 + (candidates.length - df + 0.5) / (df + 0.5),
        );
        score +=
          (idf * frequency * 2.2) /
          (frequency +
            1.2 * (0.25 + (0.75 * tokens.length) / Math.max(averageLength, 1)));
      }
      candidate.score = score;
    });

    candidates.sort(
      (left, right) =>
        right.score - left.score || left.order - right.order,
    );

    const included: GovernedContentEntry[] = [];
    let total = 0;

    for (const candidate of candidates) {
      const remaining = this.maxTotalChars - total;
      if (remaining <= 0) {
        excluded.push({
          id: candidate.id,
          reason: "context_budget_reached",
        });
        continue;
      }

      const limit = Math.min(this.maxItemChars, remaining);
      const truncated = candidate.content.length > limit;
      const content = truncated
        ? candidate.content.slice(0, limit)
        : candidate.content;

      total += content.length;
      included.push({
        id: candidate.id,
        contentRef: candidate.contentRef,
        content,
        truncated,
      });
    }

    return { included, excluded };
  }
}
