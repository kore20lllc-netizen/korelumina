import assert from "node:assert/strict";
import test from "node:test";

import {
  DocumentationHistoricalSourceDiscoverer,
} from "../DocumentationHistoricalSourceDiscoverer.js";

import type {
  DocumentationSectionAuthorityDeclaration,
} from "../DocumentationSectionAuthority.js";

import type {
  GenesisReplayScope,
} from "../GenesisSourceManifest.js";


const OPERATING_MODEL_PATH =
  "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md";


const declaration:
  DocumentationSectionAuthorityDeclaration =
  {
    repositoryRelativePath:
      OPERATING_MODEL_PATH,

    sectionSlug:
      "mission-ownership",

    currentAuthority:
      "CURRENT_SUPPORTING",

    authority: {
      authorityClass:
        "governance",

      approvalState:
        "Approved",

      owner:
        "Chief Systems Architect",

      scope:
        "Chief Agent mission-level orchestration, bounded specialist-agent execution, delegation procedure, recovery procedure, operating learning workflow, and human-approval operating gates, subordinate to higher governing authority.",

      version:
        "1.0",
    },

    basis: [
      "docs/canon/VISION_2050.md",
      "docs/architecture/reconciliation/CHIEF_AGENT_AUTHORITY_IDENTITY_RECONCILIATION.md",
    ],
  };


function scope():
  GenesisReplayScope {
  return {
    mode:
      "partial",

    repository:
      process.cwd(),

    includedEvidenceTypes: [
      "document",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "m51.5f-test",

    replayContractVersion:
      "1.0",
  };
}


test(
  "M51.5f activates only Mission Ownership and leaves sibling sections fail-closed",
  async () => {
    const discoverer =
      new DocumentationHistoricalSourceDiscoverer({
        repositoryRoot:
          process.cwd(),

        documentRoots: [
          "docs/chief-agent",
        ],

        sectionDocumentPaths: [
          OPERATING_MODEL_PATH,
        ],

        sectionAuthorityDeclarations: [
          declaration,
        ],

        historicalTimestampResolver:
          () => ({
            value:
              1_700_000_000_000,

            source:
              "m51.5f-test",
          }),

        discoveredAt:
          () =>
            1_700_000_000_001,
      });

    const result =
      await discoverer.discover(
        scope(),
      );

    const sections =
      result.sources.filter(
        source =>
          source.discoveryMethod ===
            "documentation-section-v1" &&
          source.metadata.sourceLocation ===
            OPERATING_MODEL_PATH,
      );

    const missionOwnership =
      sections.find(
        source =>
          source.metadata.sectionSlug ===
            "mission-ownership",
      );

    assert.ok(
      missionOwnership,
      "Mission Ownership section must be discovered",
    );

    assert.equal(
      missionOwnership.metadata.currentAuthority,
      "CURRENT_SUPPORTING",
    );

    assert.equal(
      missionOwnership.metadata
        .authorityDeclarationComplete,
      true,
    );

    assert.equal(
      missionOwnership.authority.approvalState,
      "Approved",
    );

    assert.equal(
      missionOwnership.authority.owner,
      "Chief Systems Architect",
    );

    assert.equal(
      missionOwnership.authority.version,
      "1.0",
    );

    const siblings =
      sections.filter(
        source =>
          source.metadata.sectionSlug !==
            "mission-ownership",
      );

    assert.ok(
      siblings.length >
        0,
    );

    for (
      const section
      of siblings
    ) {
      assert.equal(
        section.metadata.currentAuthority,
        "UNRESOLVED",
      );

      assert.equal(
        section.metadata
          .authorityDeclarationComplete,
        false,
      );

      assert.equal(
        section.authority.approvalState,
        undefined,
      );
    }
  },
);
