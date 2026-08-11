import assert from "node:assert/strict";
import test from "node:test";

import {
  getOrganizationalMemoryProvider,
  registerOrganizationalMemoryProvider,
} from "../knowledge/organizational-memory/index.js";

import {
  RuntimeOrganizationalMemoryProvider,
  RuntimeOrganizationalMemoryStore,
} from "../knowledge-platform/runtime/index.js";

test(
  "runtime organizational memory provider registers through the frozen provider registry",
  () => {
    const store =
      new RuntimeOrganizationalMemoryStore();

    const provider =
      new RuntimeOrganizationalMemoryProvider(
        store,
      );

    const existing =
      getOrganizationalMemoryProvider(
        provider.id,
      );

    if (!existing) {
      registerOrganizationalMemoryProvider(
        provider,
      );
    }

    const registered =
      getOrganizationalMemoryProvider(
        provider.id,
      );

    assert.ok(
      registered,
    );

    assert.equal(
      registered?.id,
      "runtime-organizational-memory",
    );
  },
);
