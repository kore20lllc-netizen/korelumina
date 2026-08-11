import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  RuntimeOrganizationalMemoryProvider,
} from "../RuntimeOrganizationalMemoryProvider.js";

import {
  RuntimeOrganizationalMemoryStore,
} from "../RuntimeOrganizationalMemoryStore.js";

test(
  "persists and recalls organizational memory by organization scope",
  async () => {
    const root =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-memory-",
        ),
      );

    const store =
      new RuntimeOrganizationalMemoryStore(
        root,
      );

    store.save({
      id:
        "memory:test",

      organizationId:
        "organization:korelumina",

      projectId:
        "project:korelumina",

      title:
        "KoreLumina Architecture",

      summary:
        "Canonical architecture memory.",

      source:
        "architecture",

      references: [
        "canonical:test",
      ],

      createdAt:
        new Date(
          1000,
        ).toISOString(),
    });

    const provider =
      new RuntimeOrganizationalMemoryProvider(
        store,
      );

    const result =
      await provider.recall({
        requestId:
          "request:test",

        organizationId:
          "organization:korelumina",

        projectIds: [
          "project:korelumina",
        ],

        teamIds:
          [],

        query:
          "architecture",

        references:
          [],
      });

    assert.equal(
      result.records.length,
      1,
    );

    assert.equal(
      result.records[0].id,
      "memory:test",
    );

    assert.deepEqual(
      result.insights,
      [],
    );

    fs.rmSync(
      root,
      {
        recursive: true,
        force: true,
      },
    );
  },
);

test(
  "does not recall records from another organization",
  async () => {
    const root =
      fs.mkdtempSync(
        path.join(
          os.tmpdir(),
          "korelumina-memory-",
        ),
      );

    const store =
      new RuntimeOrganizationalMemoryStore(
        root,
      );

    store.save({
      id:
        "memory:other",

      organizationId:
        "organization:other",

      title:
        "Other organization",

      summary:
        "Must remain isolated.",

      source:
        "manual",

      references:
          [],

      createdAt:
        new Date(
          1000,
        ).toISOString(),
    });

    const provider =
      new RuntimeOrganizationalMemoryProvider(
        store,
      );

    const result =
      await provider.recall({
        requestId:
          "request:test",

        organizationId:
          "organization:korelumina",

        projectIds:
          [],

        teamIds:
          [],

        query:
          "",

        references:
          [],
      });

    assert.deepEqual(
      result.records,
      [],
    );

    fs.rmSync(
      root,
      {
        recursive: true,
        force: true,
      },
    );
  },
);
