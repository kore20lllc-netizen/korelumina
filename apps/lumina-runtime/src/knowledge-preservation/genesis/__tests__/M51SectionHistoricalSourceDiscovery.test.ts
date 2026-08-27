import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  DocumentationHistoricalSourceDiscoverer,
} from "../DocumentationHistoricalSourceDiscoverer.js";

import type {
  GenesisReplayScope,
} from "../GenesisSourceManifest.js";


function replayScope(
  repositoryRoot:
    string,
): GenesisReplayScope {
  return {
    repository:
      repositoryRoot,

    mode:
      "full",

    governancePolicyVersion:
      "m51.5c2-test",

    replayContractVersion:
      "m51.5c2-test",

    includedEvidenceTypes: [
      "document",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],
  };
}


function writeDocument(
  repositoryRoot:
    string,
): string {
  const relativePath =
    "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md";

  const absolutePath =
    path.join(
      repositoryRoot,
      relativePath,
    );

  fs.mkdirSync(
    path.dirname(
      absolutePath,
    ),
    {
      recursive:
        true,
    },
  );

  fs.writeFileSync(
    absolutePath,
    [
      "# Chief Agent Mission System",
      "",
      "Status: Approved",
      "",
      "Version: 1.0",
      "",
      "## Purpose",
      "",
      "Mission execution framework.",
      "",
      "## Delegation",
      "",
      "The Chief Agent owns missions.",
      "",
      "Specialist agents own bounded tasks.",
      "",
      "## Mission Validation",
      "",
      "Human approvals must complete.",
      "",
    ].join(
      "\n",
    ),
    "utf8",
  );

  return relativePath;
}


function discoverer(
  repositoryRoot:
    string,
  sectionDocumentPaths?:
    readonly string[],
): DocumentationHistoricalSourceDiscoverer {
  return new DocumentationHistoricalSourceDiscoverer({
    repositoryRoot,

    documentRoots: [
      "docs/chief-agent",
    ],

    sectionDocumentPaths,

    historicalTimestampResolver:
      () => ({
        value:
          1_700_000_000_000,

        source:
          "m51.5c2-test",
      }),

    discoveredAt:
      () =>
        1_700_000_000_001,
  });
}


test(
  "M51.5c2 preserves whole-document discovery when section discovery is not opted in",
  async () => {
    const repositoryRoot =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-m51-section-off-",
        ),
      );

    const relativePath =
      writeDocument(
        repositoryRoot,
      );

    const result =
      await discoverer(
        repositoryRoot,
      ).discover(
        replayScope(
          repositoryRoot,
        ),
      );

    const matching =
      result.sources.filter(
        source =>
          source.metadata
            .sourceLocation ===
          relativePath,
      );

    assert.equal(
      matching.length,
      1,
      "default behavior must remain one whole-document HistoricalSource",
    );

    assert.equal(
      matching[0]
        .provenance.locator,
      relativePath,
    );

    assert.equal(
      matching[0]
        .discoveryMethod,
      "documentation-v1",
    );
  },
);


test(
  "M51.5c2 emits deterministic section child HistoricalSources only for an opted-in document",
  async () => {
    const repositoryRoot =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-m51-section-on-",
        ),
      );

    const relativePath =
      writeDocument(
        repositoryRoot,
      );

    const first =
      await discoverer(
        repositoryRoot,
        [
          relativePath,
        ],
      ).discover(
        replayScope(
          repositoryRoot,
        ),
      );

    const second =
      await discoverer(
        repositoryRoot,
        [
          relativePath,
        ],
      ).discover(
        replayScope(
          repositoryRoot,
        ),
      );

    const whole =
      first.sources.find(
        source =>
          source.provenance
            .locator ===
          relativePath,
      );

    assert.ok(
      whole,
      "whole-document HistoricalSource must remain present",
    );

    const sections =
      first.sources.filter(
        source =>
          source.discoveryMethod ===
          "documentation-section-v1",
      );

    assert.ok(
      sections.length >=
        3,
      "expected title, Purpose, Delegation and Mission Validation section sources",
    );

    const delegation =
      sections.find(
        source =>
          source.metadata
            .sectionSlug ===
          "delegation",
      );

    assert.ok(
      delegation,
      "Delegation section must be discoverable",
    );

    assert.equal(
      delegation.metadata
        .sourceLocation,
      relativePath,
    );

    assert.equal(
      delegation.metadata
        .sectionTitle,
      "Delegation",
    );

    assert.equal(
      typeof delegation.metadata
        .lineStart,
      "number",
    );

    assert.equal(
      typeof delegation.metadata
        .lineEnd,
      "number",
    );

    assert.ok(
      (
        delegation.metadata
          .lineEnd as number
      ) >=
        (
          delegation.metadata
            .lineStart as number
        ),
    );

    assert.deepEqual(
      delegation.provenance
        .parentIds,
      [
        whole.historicalSourceId,
      ],
    );

    assert.match(
      delegation.provenance
        .locator,
      /CHIEF_AGENT_MISSION_SYSTEM[.]md#section:delegation:\d+-\d+$/,
    );

    const secondDelegation =
      second.sources.find(
        source =>
          source.metadata
            .sectionSlug ===
          "delegation",
      );

    assert.ok(
      secondDelegation,
    );

    assert.equal(
      secondDelegation
        .historicalSourceId,
      delegation
        .historicalSourceId,
      "section HistoricalSource identity must be deterministic",
    );

    assert.equal(
      secondDelegation
        .stableSourceKey,
      delegation
        .stableSourceKey,
    );

    assert.equal(
      secondDelegation
        .sourceChecksum,
      delegation
        .sourceChecksum,
    );
  },
);


test(
  "M51.5c2 section discovery inherits observed authority without inventing missing authority identity",
  async () => {
    const repositoryRoot =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-m51-section-authority-",
        ),
      );

    const relativePath =
      writeDocument(
        repositoryRoot,
      );

    const result =
      await discoverer(
        repositoryRoot,
        [
          relativePath,
        ],
      ).discover(
        replayScope(
          repositoryRoot,
        ),
      );

    const delegation =
      result.sources.find(
        source =>
          source.metadata
            .sectionSlug ===
          "delegation",
      );

    assert.ok(
      delegation,
    );

    /*
     * The legacy Mission System declares Approved/Version
     * but no owner or authority scope. Section discovery
     * must not manufacture those missing governance fields.
     */
    assert.equal(
      delegation.authority.owner,
      undefined,
    );

    assert.equal(
      delegation.authority.scope,
      undefined,
    );

    assert.equal(
      delegation.authority.version,
      "1.0",
    );
  },
);
