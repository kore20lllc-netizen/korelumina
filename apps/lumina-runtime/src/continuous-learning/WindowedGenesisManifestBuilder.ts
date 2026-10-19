import {
  buildDefaultGenesisSourceManifest,
  createGenesisSourceManifestId,
  type GenesisReplayManifestBuilder,
  type GenesisSourceManifestEntry,
} from "../knowledge-preservation/genesis/index.js";

/*
 * ADR-0042 (CL-1a): a learning capture only needs the sources in its
 * window. Discovery still reads the whole repository, but sources outside
 * the window (older than the checkpoint, explicitly excluded, or of an
 * evidence type the cycle does not learn from) are dropped from the
 * manifest instead of being carried through the replay as skips.
 *
 * Without this, every cycle replayed ~1,700 skipped entries and wrote a
 * checkpoint for each one, which took about two minutes.
 */
const WINDOW_EXCLUSIONS = new Set([
  "before_replay_scope",
  "after_replay_scope",
  "explicit_source_exclusion",
]);

export function isInLearningWindow(
  entry: GenesisSourceManifestEntry,
  includedEvidenceTypes: readonly string[],
): boolean {
  if (
    entry.replayEligibility === "excluded" &&
    entry.exclusionReason &&
    WINDOW_EXCLUSIONS.has(entry.exclusionReason)
  ) {
    return false;
  }
  return includedEvidenceTypes.includes(entry.evidenceType);
}

/*
 * A document with no commit yet (for example a Learning Record the Runtime
 * just wrote) has no git timestamp, which Genesis reports as a discovery
 * error that blocks the whole replay. For learning it is simply not in any
 * window yet: it is learned once it is committed. Such sources are left out
 * here instead of failing the cycle.
 */
export function isUncommittedDocumentError(error: {
  code?: string;
  historicalSourceId?: string;
}): boolean {
  return error.code === "TIMESTAMP_UNAVAILABLE" && Boolean(error.historicalSourceId);
}

export const windowedGenesisManifestBuilder: GenesisReplayManifestBuilder =
  async (input) => {
    const built = await buildDefaultGenesisSourceManifest(input);
    const notYetCommitted = new Set(
      built.errors
        .filter(isUncommittedDocumentError)
        .map((error) => error.historicalSourceId as string),
    );
    const errors = built.errors.filter(
      (error) => !isUncommittedDocumentError(error),
    );
    const entries = built.manifest.entries.filter(
      (entry) =>
        !notYetCommitted.has(entry.historicalSourceId) &&
        isInLearningWindow(
          entry,
          built.manifest.scope.includedEvidenceTypes,
        ),
    );

    return {
      ...built,
      errors,
      readiness: errors.length === 0 ? "READY" : built.readiness,
      manifest: {
        ...built.manifest,
        entries,
        manifestId: createGenesisSourceManifestId({
          replayContractVersion: built.manifest.replayContractVersion,
          scope: built.manifest.scope,
          entries,
        }),
      },
    };
  };
