import assert from "node:assert/strict";
import test from "node:test";

import {
  sectionAuthorityMaySeed,
} from "../DocumentationSectionAuthority.js";


test(
  "M51.5d1 unresolved section cannot become seedable",
  () => {
    assert.equal(
      sectionAuthorityMaySeed({
        repositoryRelativePath:
          "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

        sectionSlug:
          "human-approval-gates",

        currentAuthority:
          "UNRESOLVED",

        authority: {
          authorityClass:
            "governance",

          approvalState:
            "Approved",

          owner:
            "Some Owner",

          scope:
            "Some Scope",

          version:
            "1.0",
        },

        basis: [
          "test",
        ],
      }),
      false,
    );
  },
);


test(
  "M51.5d1 historical or conflicted sections cannot become seedable",
  () => {
    for (
      const currentAuthority
      of [
        "HISTORICAL_VALID",
        "SUPERSEDED",
        "CONFLICTED",
      ] as const
    ) {
      assert.equal(
        sectionAuthorityMaySeed({
          repositoryRelativePath:
            "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

          sectionSlug:
            "learning-workflow",

          currentAuthority,

          authority: {
            authorityClass:
              "governance",

            approvalState:
              "Approved",

            owner:
              "Owner",

            scope:
              "Scope",

            version:
              "1.0",
          },

          basis: [
            "test",
          ],
        }),
        false,
      );
    }
  },
);


test(
  "M51.5d1 current section still requires complete explicit governance identity",
  () => {
    assert.equal(
      sectionAuthorityMaySeed({
        repositoryRelativePath:
          "docs/chief-agent/CHIEF_AGENT_OPERATING_MODEL.md",

        sectionSlug:
          "mission-ownership",

        currentAuthority:
          "CURRENT_SUPPORTING",

        authority: {
          authorityClass:
            "governance",

          approvalState:
            "Approved",

          version:
            "1.0",
        },

        basis: [
          "Vision 2050",
          "CA-005",
        ],
      }),
      false,
      "missing owner/scope must remain fail-closed",
    );
  },
);


test(
  "M51.5d1 only a current and governance-complete declaration may cross the section authority gate",
  () => {
    assert.equal(
      sectionAuthorityMaySeed({
        repositoryRelativePath:
          "docs/example/CURRENT.md",

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
            "Explicit Governance Owner",

          scope:
            "Explicit Governance Scope",

          version:
            "1.0",
        },

        basis: [
          "explicit-governance-declaration",
        ],
      }),
      true,
    );
  },
);
