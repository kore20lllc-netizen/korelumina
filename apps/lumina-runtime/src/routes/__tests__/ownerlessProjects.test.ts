import assert from "node:assert/strict";
import test from "node:test";

import type { ProjectMetadata } from "../../projects/projectMetadataStore.js";
import { canManageProject, canViewProject } from "../runtimeAuthorization.js";
import type { RuntimeCaller } from "../runtimeCaller.js";

/* A project with no owner is not open to every signed-in customer. */

const ownerless: ProjectMetadata = { projectId: "old", visibility: "private", createdAt: 1, updatedAt: 1 };
const customer: RuntimeCaller = { role: "business", userId: "stranger", supportAccess: false, adminTools: false };
const staff: RuntimeCaller = { role: "inhouse-dev", userId: "eng", supportAccess: true, adminTools: false };

function withEnvironment(values: Record<string, string | undefined>, run: () => void) {
  const saved = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("with real sign-in configured, an ownerless project is for staff only", () => {
  withEnvironment({ SUPABASE_URL: "https://example.supabase.co", LUMINA_ALLOW_OWNERLESS_PROJECTS: undefined }, () => {
    assert.equal(canViewProject(customer, ownerless), false);
    assert.equal(canManageProject(customer, ownerless), false);
    assert.equal(canViewProject(staff, ownerless), true);
  });
});

test("local development with the mock sign-in, or the explicit setting, keeps ownerless projects open", () => {
  withEnvironment({ SUPABASE_URL: undefined, KORELUMINA_SUPABASE_URL: undefined, NODE_ENV: "development", LUMINA_ALLOW_OWNERLESS_PROJECTS: undefined }, () => {
    assert.equal(canViewProject(customer, ownerless), true);
  });
  withEnvironment({ SUPABASE_URL: "https://example.supabase.co", LUMINA_ALLOW_OWNERLESS_PROJECTS: "true" }, () => {
    assert.equal(canViewProject(customer, ownerless), true);
  });
});
