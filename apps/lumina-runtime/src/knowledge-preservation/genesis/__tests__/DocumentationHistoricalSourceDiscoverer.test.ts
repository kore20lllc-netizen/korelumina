import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  writeFileSync,
  rmSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import path from "node:path";

import type {
  GenesisReplayScope,
} from "../index.js";

import {
  DocumentationHistoricalSourceDiscoverer,
} from "../index.js";

function repository():
  string {
  return mkdtempSync(
    path.join(
      tmpdir(),
      "korelumina-genesis-docs-",
    ),
  );
}

function write(
  root:
    string,

  relative:
    string,

  content:
    string,
): void {
  const absolute =
    path.join(
      root,
      relative,
    );

  mkdirSync(
    path.dirname(
      absolute,
    ),
    {
      recursive:
        true,
    },
  );

  writeFileSync(
    absolute,
    content,
    "utf8",
  );
}

function scope(
  overrides:
    Partial<
      GenesisReplayScope
    > = {},
): GenesisReplayScope {
  return {
    mode:
      "partial",

    repository:
      "kore20lllc-netizen/korelumina",

    ref:
      "main",

    includedEvidenceTypes: [
      "ADR",
      "RFC",
      "document",
      "specification",
      "roadmap",
    ],

    excludedEvidenceTypes:
      [],

    explicitlyExcludedSourceIds:
      [],

    governancePolicyVersion:
      "governance-v1",

    replayContractVersion:
      "1.0",

    ...overrides,
  };
}

function discoverer(
  root:
    string,

  timestamp =
    1_700_000_000_000,
) {
  return new DocumentationHistoricalSourceDiscoverer({
    repositoryRoot:
      root,

    documentRoots: [
      "docs",
    ],

    discoveredAt:
      () =>
        9_000,

    historicalTimestampResolver:
      () => ({
        value:
          timestamp,

        source:
          "fixture-history",
      }),
  });
}

test(
  "documentation discovery traverses Markdown files deterministically by repository-relative path",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/ZETA.md",
      "# Zeta",
    );

    write(
      root,
      "docs/architecture/ALPHA.md",
      "# Alpha",
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.deepEqual(
      result.sources.map(
        (
          source,
        ) =>
          source.provenance.locator,
      ),
      [
        "docs/architecture/ALPHA.md",
        "docs/architecture/ZETA.md",
      ],
    );
  },
);

test(
  "non-Markdown files are not discovered as documentation",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/ARCH.md",
      "# Architecture",
    );

    write(
      root,
      "docs/architecture/notes.txt",
      "not governed markdown",
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.equal(
      result.sources.length,
      1,
    );

    assert.equal(
      result.sources[0]
        .provenance.locator,
      "docs/architecture/ARCH.md",
    );
  },
);

test(
  "architecture documentation maps to document Evidence while retaining architecture source class",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/PLATFORM.md",
      "# Platform",
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources[0];

    assert.equal(
      source.sourceClass,
      "architecture-document",
    );

    assert.equal(
      source.evidenceType,
      "document",
    );

    assert.equal(
      source.authority
        .authorityClass,
      "architecture",
    );
  },
);

test(
  "ADR and RFC paths retain their governed Evidence types",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/adr/ADR-001.md",
      "# ADR 001",
    );

    write(
      root,
      "docs/rfc/RFC-001.md",
      "# RFC 001",
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const byLocator =
      new Map(
        result.sources.map(
          (
            source,
          ) => [
            source.provenance
              .locator,
            source,
          ],
        ),
      );

    assert.equal(
      byLocator.get(
        "docs/adr/ADR-001.md",
      )?.evidenceType,
      "ADR",
    );

    assert.equal(
      byLocator.get(
        "docs/rfc/RFC-001.md",
      )?.evidenceType,
      "RFC",
    );
  },
);

test(
  "specification and roadmap documentation retain specialized Evidence types",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/specifications/API.md",
      "# API Specification",
    );

    write(
      root,
      "docs/roadmaps/GENESIS.md",
      "# Genesis Roadmap",
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.deepEqual(
      result.sources.map(
        (
          source,
        ) =>
          source.evidenceType,
      ),
      [
        "roadmap",
        "specification",
      ].sort(),
    );
  },
);

test(
  "content checksum is deterministic and changes when document content changes",
  async () => {
    const firstRoot =
      repository();

    const secondRoot =
      repository();

    write(
      firstRoot,
      "docs/architecture/A.md",
      "# Same",
    );

    write(
      secondRoot,
      "docs/architecture/A.md",
      "# Changed",
    );

    const first =
      await discoverer(
        firstRoot,
      ).discover(
        scope(),
      );

    const second =
      await discoverer(
        secondRoot,
      ).discover(
        scope(),
      );

    assert.match(
      first.sources[0]
        .sourceChecksum,
      /^sha256:[a-f0-9]{64}$/,
    );

    assert.notEqual(
      first.sources[0]
        .sourceChecksum,
      second.sources[0]
        .sourceChecksum,
    );

    assert.equal(
      first.sources[0]
        .historicalSourceId,
      second.sources[0]
        .historicalSourceId,
    );
  },
);

test(
  "document source identity depends on stable repository provenance rather than content",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/A.md",
      "# Version One",
    );

    const first =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    write(
      root,
      "docs/architecture/A.md",
      "# Version Two",
    );

    const second =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.equal(
      first.sources[0]
        .historicalSourceId,
      second.sources[0]
        .historicalSourceId,
    );

    assert.notEqual(
      first.sources[0]
        .sourceChecksum,
      second.sources[0]
        .sourceChecksum,
    );
  },
);

test(
  "explicit document governance metadata is retained",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/GOVERNED.md",
      [
        "# Governed Architecture",
        "",
        "Authority: Constitutional Architecture",
        "Approval State: approved",
        "Owner: Knowledge Platform",
        "Scope: genesis",
        "Version: 7",
        "Status: active",
      ].join(
        "\n",
      ),
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources[0];

    assert.equal(
      source.authority
        .authorityClass,
      "Constitutional Architecture",
    );

    assert.equal(
      source.authority
        .approvalState,
      "approved",
    );

    assert.equal(
      source.authority.owner,
      "Knowledge Platform",
    );

    assert.equal(
      source.authority.scope,
      "genesis",
    );

    assert.equal(
      source.authority.version,
      "7",
    );

    assert.equal(
      source.metadata.status,
      "active",
    );
  },
);

test(
  "document title is extracted from the first level-one heading",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/TITLE.md",
      [
        "Status: active",
        "",
        "# Historical Replay Architecture",
      ].join(
        "\n",
      ),
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.equal(
      result.sources[0]
        .metadata.title,
      "Historical Replay Architecture",
    );
  },
);

test(
  "documents outside Evidence-type replay scope remain represented but excluded",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/A.md",
      "# Architecture",
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope({
          includedEvidenceTypes: [
            "commit",
          ],
        }),
      );

    assert.equal(
      result.sources.length,
      1,
    );

    assert.equal(
      result.sources[0]
        .replayEligibility,
      "excluded",
    );

    assert.equal(
      result.sources[0]
        .exclusionReason,
      "evidence_type_outside_replay_scope",
    );
  },
);

test(
  "chronologically out-of-scope document remains represented as excluded",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/A.md",
      "# Architecture",
    );

    const result =
      await discoverer(
        root,
        100,
      ).discover(
        scope({
          historicalStart:
            200,
        }),
      );

    assert.equal(
      result.sources[0]
        .replayEligibility,
      "excluded",
    );

    assert.equal(
      result.sources[0]
        .exclusionReason,
      "before_replay_scope",
    );
  },
);

test(
  "missing trustworthy historical timestamp blocks the document instead of inventing time",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/A.md",
      "# Architecture",
    );

    const finder =
      new DocumentationHistoricalSourceDiscoverer({
        repositoryRoot:
          root,

        documentRoots: [
          "docs",
        ],

        discoveredAt:
          () =>
            9_000,

        historicalTimestampResolver:
          () =>
            null,
      });

    const result =
      await finder.discover(
        scope(),
      );

    assert.equal(
      result.sources[0]
        .replayEligibility,
      "blocked",
    );

    assert.equal(
      result.sources[0]
        .historicalTimestamp
        .source,
      "unavailable",
    );

    assert.equal(
      result.errors[0].code,
      "TIMESTAMP_UNAVAILABLE",
    );
  },
);

test(
  "discoveredAt is operational provenance and independent from historical timestamp",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/A.md",
      "# Architecture",
    );

    const result =
      await discoverer(
        root,
        1234,
      ).discover(
        scope(),
      );

    assert.equal(
      result.sources[0]
        .historicalTimestamp
        .value,
      1234,
    );

    assert.equal(
      result.sources[0]
        .discoveredAt,
      9000,
    );
  },
);

test(
  "symbolic links are not followed during documentation discovery",
  async () => {
    const root =
      repository();

    const outside =
      repository();

    write(
      outside,
      "SECRET.md",
      "# Outside",
    );

    mkdirSync(
      path.join(
        root,
        "docs",
      ),
      {
        recursive:
          true,
      },
    );

    symlinkSync(
      path.join(
        outside,
        "SECRET.md",
      ),
      path.join(
        root,
        "docs",
        "LINK.md",
      ),
    );

    write(
      root,
      "docs/SAFE.md",
      "# Safe",
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    assert.deepEqual(
      result.sources.map(
        (
          source,
        ) =>
          source.provenance.locator,
      ),
      [
        "docs/SAFE.md",
      ],
    );
  },
);

test(
  "default governed roots include Constitution Blueprint and certification records",
  async () => {
    const root =
      repository();

    write(
      root,
      "BLUEPRINT.md",
      "# Platform Blueprint",
    );

    write(
      root,
      "docs/constitution/KORELUMINA_CONSTITUTION.md",
      "# Constitution",
    );

    write(
      root,
      "docs/certification/KNOWLEDGE_OPERATIONS_RECONSTRUCTION_CERTIFICATION.md",
      "# Knowledge Operations Certification",
    );

    const finder =
      new DocumentationHistoricalSourceDiscoverer({
        repositoryRoot:
          root,

        discoveredAt:
          () =>
            9000,

        historicalTimestampResolver:
          () => ({
            value:
              1000,

            source:
              "fixture-history",
          }),
      });

    const result =
      await finder.discover(
        scope(),
      );

    const byLocator =
      new Map(
        result.sources.map(
          (
            source,
          ) => [
            source.provenance
              .locator,
            source,
          ],
        ),
      );

    assert.equal(
      byLocator.get(
        "BLUEPRINT.md",
      )?.authority
        .authorityClass,
      "blueprint",
    );

    assert.equal(
      byLocator.get(
        "docs/constitution/KORELUMINA_CONSTITUTION.md",
      )?.authority
        .authorityClass,
      "constitution",
    );

    assert.equal(
      byLocator.get(
        "docs/certification/KNOWLEDGE_OPERATIONS_RECONSTRUCTION_CERTIFICATION.md",
      )?.authority
        .authorityClass,
      "certification",
    );
  },
);

test(
  "default governed discovery does not silently ingest archives or handoffs",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/CURRENT.md",
      "# Current Architecture",
    );

    write(
      root,
      "docs/archive/knowledge-operations/OLD.md",
      "# Archived Knowledge Operations",
    );

    write(
      root,
      "docs/handoffs/HANDOFF.md",
      "# Historical Handoff",
    );

    const finder =
      new DocumentationHistoricalSourceDiscoverer({
        repositoryRoot:
          root,

        discoveredAt:
          () =>
            9000,

        historicalTimestampResolver:
          () => ({
            value:
              1000,

            source:
              "fixture-history",
          }),
      });

    const result =
      await finder.discover(
        scope(),
      );

    assert.deepEqual(
      result.sources.map(
        (
          source,
        ) =>
          source.provenance.locator,
      ),
      [
        "docs/architecture/CURRENT.md",
      ],
    );
  },
);

test(
  "Git-resolved current document timestamp is explicitly a last-change timestamp",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/A.md",
      "# Architecture",
    );

    const finder =
      new DocumentationHistoricalSourceDiscoverer({
        repositoryRoot:
          root,

        documentRoots: [
          "docs",
        ],

        discoveredAt:
          () =>
            9000,

        historicalTimestampResolver:
          () => ({
            value:
              1234,

            source:
              "git-last-change-time",
          }),
      });

    const result =
      await finder.discover(
        scope(),
      );

    assert.equal(
      result.sources[0]
        .historicalTimestamp
        .source,
      "git-last-change-time",
    );
  },
);


test(
  "canonical document status is normalized for manufacturing while observed status remains preserved",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/canon/VISION.md",
      [
        "---",
        "title: Vision",
        "status: Canonical",
        "owner: Constitutional Office",
        "authority: Supreme",
        "version: 1.0.0",
        "---",
        "",
        "# Vision",
      ].join(
        "\n",
      ),
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources[0];

    assert.equal(
      source.authority
        .approvalState,
      "approved",
    );

    assert.equal(
      source.metadata.status,
      "Canonical",
    );
  },
);


test(
  "authoritative document status is normalized for manufacturing without inventing missing identity fields",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/00_PLATFORM_CONSTITUTION.md",
      [
        "# Platform Constitution",
        "",
        "Status: Authoritative",
      ].join(
        "\n",
      ),
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources[0];

    assert.equal(
      source.authority
        .approvalState,
      "approved",
    );

    assert.equal(
      source.metadata.status,
      "Authoritative",
    );

    assert.equal(
      source.authority.owner,
      undefined,
    );

    assert.equal(
      source.authority.scope,
      undefined,
    );

    assert.equal(
      source.authority.version,
      undefined,
    );
  },
);


test(
  "section-style authoritative status is normalized to approved",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/00_PLATFORM_CONSTITUTION.md",
      [
        "# KoreLumina Platform Constitution",
        "",
        "## Status",
        "",
        "Authoritative.",
        "",
        "This document governs KoreLumina architecture.",
      ].join(
        "\n",
      ),
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources[0];

    assert.equal(
      source.authority
        .approvalState,
      "approved",
    );

    assert.equal(
      source.metadata.status,
      "Authoritative",
    );

  },
);


test(
  "constitutional amendment record with approval date normalizes to approved while retaining observed status",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/architecture/amendments/CA-005_LEARNING_CONSTITUTION.md",
      [
        "---",
        "title: CA-005 Learning Constitution",
        "status: Constitutional Amendment Record",
        "authority: Constitutional Amendment",
        "owner: Constitutional Office",
        "version: 1.0.0",
        "approval_date: 2026-07-31",
        "---",
        "",
        "# CA-005 — Learning Constitution",
      ].join(
        "\n",
      ),
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources[0];

    assert.equal(
      source.authority
        .approvalState,
      "approved",
    );

    assert.equal(
      source.metadata.status,
      "Constitutional Amendment Record",
    );

    assert.equal(
      source.metadata.approvalDate,
      "2026-07-31",
    );
  },
);


test(
  "audit document is not promoted to approved manufacturing authority",
  async () => {
    const root =
      repository();

    write(
      root,
      "docs/governance/AUDIT.md",
      [
        "---",
        "title: Governance Audit",
        "status: Audit",
        "owner: Constitutional Office",
        "authority: Governance",
        "version: 1.0.0",
        "---",
        "",
        "# Governance Audit",
      ].join(
        "\n",
      ),
    );

    const result =
      await discoverer(
        root,
      ).discover(
        scope(),
      );

    const source =
      result.sources[0];

    assert.equal(
      source.authority
        .approvalState,
      "Audit",
    );

    assert.equal(
      source.metadata.status,
      "Audit",
    );
  },
);


test(
  "discovers accepted knowledge-recovery specifications from the governed default roots",
  async () => {
    const repositoryRoot =
      mkdtempSync(
        path.join(
          tmpdir(),
          "korelumina-genesis-knowledge-recovery-",
        ),
      );

    try {
      const knowledgeRecoveryDirectory =
        path.join(
          repositoryRoot,
          "docs",
          "knowledge-recovery",
        );

      mkdirSync(
        knowledgeRecoveryDirectory,
        {
          recursive:
            true,
        },
      );

      const repositoryRelativePath =
        "docs/knowledge-recovery/KR-005_REPOSITORY_KNOWLEDGE_RECOVERY_SPECIFICATION.md";

      writeFileSync(
        path.join(
          repositoryRoot,
          repositoryRelativePath,
        ),
        [
          "# KR-005 — Repository Knowledge Recovery Specification",
          "",
          "## Status",
          "",
          "Accepted",
          "",
          "## Purpose",
          "",
          "Define the canonical process for recovering engineering knowledge from an existing repository.",
          "",
          "Knowledge Compiler",
          "",
          "↓",
          "",
          "Knowledge IR",
        ].join(
          "\n",
        ),
        "utf8",
      );

      const discoverer =
        new DocumentationHistoricalSourceDiscoverer({
          repositoryRoot,

          discoveredAt:
            () =>
              1_700_000_000_000,

          historicalTimestampResolver:
            () => ({
              value:
                1_699_000_000_000,

              source:
                "test",
            }),
        });

      const result =
        await discoverer.discover({
          mode:
            "partial",

          repository:
            "kore20lllc-netizen/korelumina",

          ref:
            "main",

          includedEvidenceTypes: [
            "ADR",
            "RFC",
            "document",
            "specification",
            "roadmap",
          ],

          excludedEvidenceTypes:
            [],

          explicitlyExcludedSourceIds:
            [],

          governancePolicyVersion:
            "governance-v1",

          replayContractVersion:
            "1.0",
        });

      const source =
        result.sources.find(
          candidate =>
            candidate.provenance
              .locator ===
            repositoryRelativePath,
        );

      assert.ok(
        source,
      );

      assert.equal(
        source.evidenceType,
        "document",
      );

      assert.equal(
        source.replayEligibility,
        "eligible",
      );

      assert.equal(
        source.authority
          ?.approvalState,
        "Accepted",
      );

      assert.equal(
        source.provenance
          .locator,
        repositoryRelativePath,
      );

      assert.match(
        source.historicalSourceId,
        /^genesis-source:document:derived:/,
      );
    } finally {
      rmSync(
        repositoryRoot,
        {
          recursive:
            true,

          force:
            true,
        },
      );
    }
  },
);
