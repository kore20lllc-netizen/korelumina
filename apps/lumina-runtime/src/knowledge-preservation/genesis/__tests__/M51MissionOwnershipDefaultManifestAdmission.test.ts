import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveRepositoryRoot,
} from "../../storage/resolveKnowledgeStorageRoot.js";

import {
  buildDefaultGenesisSourceManifest,
} from "../GenesisSourceManifestBuilder.js";

import {
  classifyGenesisHistoricalAdmission,
} from "../GenesisHistoricalAdmissionGovernancePolicy.js";

import type {
  GenesisReplayScope,
} from "../GenesisSourceManifest.js";


/*
 * F-30: these tests read the repository's real Chief Agent Operating Model.
 * Resolve the repository root instead of assuming the tests are run from
 * it, so they pass from apps/lumina-runtime as well.
 */
const REPOSITORY_ROOT =
  resolveRepositoryRoot();

const OPERATING_MODEL_PATH =
  "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md";


function scope():
  GenesisReplayScope {
  return {
    mode:
      "partial",

    repository:
      REPOSITORY_ROOT,

    includedEvidenceTypes: [
      "document",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "m51.5f-default-manifest-test",

    replayContractVersion:
      "1.0",
  };
}


test(
  "M51.5f default manifest exposes Mission Ownership as the only complete current Operating Model section",
  async () => {
    const result =
      await buildDefaultGenesisSourceManifest({
        repositoryRoot:
          REPOSITORY_ROOT,

        scope:
          scope(),

        discoveredAt:
          1_700_000_000_001,
      });

    assert.equal(
      result.readiness,
      "READY",
    );

    const operatingModelSections =
      result.manifest.entries.filter(
        entry =>
          entry.discoveryMethod ===
            "documentation-section-v1" &&
          entry.metadata.sourceLocation ===
            OPERATING_MODEL_PATH,
      );

    const missionOwnership =
      operatingModelSections.find(
        entry =>
          entry.metadata.sectionSlug ===
            "mission-ownership",
      );

    assert.ok(
      missionOwnership,
      "default manifest must contain Mission Ownership section",
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
      missionOwnership.approvalState,
      "Approved",
    );

    assert.equal(
      missionOwnership.authorityOwner,
      "Chief Systems Architect",
    );

    assert.equal(
      missionOwnership.authorityVersion,
      "1.0",
    );

    const siblings =
      operatingModelSections.filter(
        entry =>
          entry.metadata.sectionSlug !==
            "mission-ownership",
      );

    assert.ok(
      siblings.length >
        0,
    );

    for (
      const sibling
      of siblings
    ) {
      assert.equal(
        sibling.metadata.currentAuthority,
        "UNRESOLVED",
      );

      assert.equal(
        sibling.metadata
          .authorityDeclarationComplete,
        false,
      );
    }
  },
);


test(
  "M51.5f Mission Ownership passes existing historical admission governance while siblings remain fail-closed",
  async () => {
    const result =
      await buildDefaultGenesisSourceManifest({
        repositoryRoot:
          REPOSITORY_ROOT,

        scope:
          scope(),

        discoveredAt:
          1_700_000_000_001,
      });

    const sections =
      result.manifest.entries.filter(
        entry =>
          entry.discoveryMethod ===
            "documentation-section-v1" &&
          entry.metadata.sourceLocation ===
            OPERATING_MODEL_PATH,
      );

    const missionOwnership =
      sections.find(
        entry =>
          entry.metadata.sectionSlug ===
            "mission-ownership",
      );

    assert.ok(
      missionOwnership,
    );

    const missionDecision =
      classifyGenesisHistoricalAdmission(
        missionOwnership,
      );

    assert.equal(
      missionDecision.classification,
      "knowledge-seeding-eligible",
    );

    const siblings =
      sections.filter(
        entry =>
          entry.metadata.sectionSlug !==
            "mission-ownership",
      );

    for (
      const sibling
      of siblings
    ) {
      const decision =
        classifyGenesisHistoricalAdmission(
          sibling,
        );

      assert.notEqual(
        decision.classification,
        "knowledge-seeding-eligible",
        `sibling ${String(
          sibling.metadata.sectionSlug,
        )} must remain blocked`,
      );
    }
  },
);
