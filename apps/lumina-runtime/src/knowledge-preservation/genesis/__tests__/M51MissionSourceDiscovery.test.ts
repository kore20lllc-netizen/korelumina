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


function writeDocument(
  repositoryRoot:
    string,
  repositoryRelativePath:
    string,
  content:
    string,
): void {
  const absolutePath =
    path.join(
      repositoryRoot,
      repositoryRelativePath,
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
    content,
    "utf8",
  );
}


function fullReplayScope(
  repositoryRoot:
    string,
): GenesisReplayScope {
  return {
    repository:
      repositoryRoot,

    mode:
      "full",

    governancePolicyVersion:
      "m51.5a-test",

    replayContractVersion:
      "m51.5a-test",

    includedEvidenceTypes: [
      "conversation",
      "commit",
      "tag",
      "branch",
      "ADR",
      "RFC",
      "document",
      "source-file",
      "runtime-event",
      "engineering-execution",
      "issue",
      "pull-request",
      "specification",
      "roadmap",
      "milestone",
      "build-output",
      "incident-log",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],
  };
}


test(
  "M51.5a discovers Chief Agent mission sources through the governed documentation discoverer",
  async () => {
    const repositoryRoot =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-m51-mission-discovery-",
        ),
      );

    writeDocument(
      repositoryRoot,
      "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",
      [
        "# Chief Agent Mission System",
        "",
        "Status: Approved",
        "",
        "Mission ownership remains governed.",
      ].join(
        "\n",
      ),
    );

    writeDocument(
      repositoryRoot,
      "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",
      [
        "# Chief Agent Operating Model",
        "",
        "Status: Approved",
        "",
        "Human approval remains required.",
      ].join(
        "\n",
      ),
    );

    const discoverer =
      new DocumentationHistoricalSourceDiscoverer({
        repositoryRoot,

        historicalTimestampResolver:
          () => ({
            value:
              1_700_000_000_000,

            source:
              "m51.5a-test",
          }),

        discoveredAt:
          () =>
            1_700_000_000_001,
      });

    const result =
      await discoverer.discover(
        fullReplayScope(
          repositoryRoot,
        ),
      );

    assert.deepEqual(
      result.errors,
      [],
    );

    const sourceLocations =
      result.sources.map(
        source =>
          source.provenance.locator,
      );

    assert.ok(
      sourceLocations.includes(
        "docs/chief-agent/CHIEF_AGENT_MISSION_SYSTEM.md",
      ),
      "Mission System must cross Genesis documentation discovery",
    );

    assert.ok(
      sourceLocations.includes(
        "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",
      ),
      "Operating Model must cross Genesis documentation discovery",
    );
  },
);


test(
  "M51.5a discovery does not promote or classify Draft Chief Agent authority as current knowledge",
  async () => {
    const repositoryRoot =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-m51-draft-discovery-",
        ),
      );

    writeDocument(
      repositoryRoot,
      "docs/architecture/chief-agent/GA-004_CHIEF_AGENT_MISSION_EXECUTION_FRAMEWORK.md",
      [
        "# GA-004",
        "",
        "Status: Draft",
        "",
        "Draft mission execution architecture.",
      ].join(
        "\n",
      ),
    );

    const discoverer =
      new DocumentationHistoricalSourceDiscoverer({
        repositoryRoot,

        historicalTimestampResolver:
          () => ({
            value:
              1_700_000_000_000,

            source:
              "m51.5a-test",
          }),

        discoveredAt:
          () =>
            1_700_000_000_001,
      });

    const result =
      await discoverer.discover(
        fullReplayScope(
          repositoryRoot,
        ),
      );

    const ga004 =
      result.sources.find(
        source =>
          source.provenance.locator ===
          "docs/architecture/chief-agent/GA-004_CHIEF_AGENT_MISSION_EXECUTION_FRAMEWORK.md",
      );

    assert.ok(
      ga004,
      "GA-004 must remain discoverable for downstream governance",
    );

    assert.equal(
      ga004.metadata.status,
      "Draft",
      "Discovery must preserve Draft status rather than silently promote it",
    );
  },
);
