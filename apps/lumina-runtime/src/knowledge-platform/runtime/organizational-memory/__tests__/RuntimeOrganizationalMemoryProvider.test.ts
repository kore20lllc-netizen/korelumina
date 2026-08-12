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

const organizationId =
  "organization:korelumina";

const projectId =
  "project:korelumina";

function createIsolatedStore() {
  const root =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "korelumina-memory-test-",
      ),
    );

  return {
    root,
    store:
      new RuntimeOrganizationalMemoryStore(
        root,
      ),
  };
}

test(
  "recalls organizational memory from natural-language query terms",
  async () => {
    const {
      root,
      store,
    } =
      createIsolatedStore();

    try {
      store.saveAll([
        {
          id:
            "memory:architecture",

          organizationId,

          projectId,

          title:
            "KoreLumina Master Architecture",

          summary:
            "Governed canonical architecture and organizational knowledge boundaries.",

          source:
            "architecture",

          references: [
            "canonical:architecture",
          ],

          createdAt:
            new Date(0)
              .toISOString(),
        },
      ]);

      const provider =
        new RuntimeOrganizationalMemoryProvider(
          store,
        );

      const result =
        await provider.recall({
          requestId:
            "request:test",

          organizationId,

          projectIds: [
            projectId,
          ],

          teamIds:
            [],

          query:
            "Using governed KoreLumina canonical knowledge and organizational memory, identify architecture governance boundaries.",

          references:
            [],
        });

      assert.deepEqual(
        result.records.map(
          (record) =>
            record.id,
        ),
        [
          "memory:architecture",
        ],
      );
    } finally {
      fs.rmSync(
        root,
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

test(
  "still honors exact canonical references",
  async () => {
    const {
      root,
      store,
    } =
      createIsolatedStore();

    try {
      store.saveAll([
        {
          id:
            "memory:referenced",

          organizationId,

          projectId,

          title:
            "Unrelated title",

          summary:
            "Unrelated summary.",

          source:
            "architecture",

          references: [
            "canonical:architecture",
          ],

          createdAt:
            new Date(0)
              .toISOString(),
        },
      ]);

      const provider =
        new RuntimeOrganizationalMemoryProvider(
          store,
        );

      const result =
        await provider.recall({
          requestId:
            "request:reference",

          organizationId,

          projectIds: [
            projectId,
          ],

          teamIds:
            [],

          query:
            "completely unrelated wording",

          references: [
            "canonical:architecture",
          ],
        });

      assert.deepEqual(
        result.records.map(
          (record) =>
            record.id,
        ),
        [
          "memory:referenced",
        ],
      );
    } finally {
      fs.rmSync(
        root,
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

test(
  "does not cross organization scope",
  async () => {
    const {
      root,
      store,
    } =
      createIsolatedStore();

    try {
      store.saveAll([
        {
          id:
            "memory:other-org",

          organizationId:
            "organization:other",

          projectId,

          title:
            "KoreLumina Architecture",

          summary:
            "Architecture governance.",

          source:
            "architecture",

          references:
            [],

          createdAt:
            new Date(0)
              .toISOString(),
        },
      ]);

      const provider =
        new RuntimeOrganizationalMemoryProvider(
          store,
        );

      const result =
        await provider.recall({
          requestId:
            "request:isolation",

          organizationId,

          projectIds: [
            projectId,
          ],

          teamIds:
            [],

          query:
            "architecture governance",

          references:
            [],
        });

      assert.equal(
        result.records.length,
        0,
      );
    } finally {
      fs.rmSync(
        root,
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
