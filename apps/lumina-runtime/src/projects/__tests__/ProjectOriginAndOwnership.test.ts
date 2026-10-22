import assert from "node:assert/strict";
import test from "node:test";

import type { RuntimeCaller } from "../../routes/runtimeCaller.js";
import type { ProjectMetadata } from "../projectMetadataStore.js";
import { isImportedProject, projectOrigin } from "../projectOrigin.js";
import { decideProjectOwnership, definedOnly } from "../projectOwnership.js";

/* MS-2026-0013: every project says where it came from, and only its owner changes it. */

const meta = (fields: Partial<ProjectMetadata>): ProjectMetadata => ({ projectId: "p", createdAt: 1, updatedAt: 1, ...fields });
const caller = (fields: Partial<RuntimeCaller>): RuntimeCaller => ({ role: "user", supportAccess: false, adminTools: false, ...fields });

test("a recorded origin is reported as recorded", () => {
  const git = meta({ origin: { kind: "git", provider: "gitlab", host: "gitlab.com", source: "https://gitlab.com/a/b.git", importedAt: 5 } });
  assert.deepEqual(projectOrigin(git), { kind: "git", provider: "gitlab", host: "gitlab.com", source: "https://gitlab.com/a/b.git", importedAt: 5, recorded: true });
  assert.equal(projectOrigin(meta({ origin: { kind: "archive", source: "shop.zip", importedAt: 1 } })).kind, "archive");
  assert.equal(projectOrigin(meta({ origin: { kind: "built", createdAt: 1 } })).kind, "built");
});

test("projects imported before origins were recorded are git imports from their source URL; anything else is unknown", () => {
  assert.deepEqual(projectOrigin(meta({ sourceUrl: "https://github.com/acme/shop.git" })), {
    kind: "git",
    provider: "github",
    host: "github.com",
    source: "https://github.com/acme/shop.git",
    recorded: false,
  });
  assert.deepEqual(projectOrigin(meta({})), { kind: "unknown", recorded: false });
  assert.deepEqual(projectOrigin(null), { kind: "unknown", recorded: false });
});

test("only imported projects are eligible for diagnosis and paid repair", () => {
  assert.equal(isImportedProject(meta({ origin: { kind: "git", provider: "github", host: "github.com", source: "x", importedAt: 1 } })), true);
  assert.equal(isImportedProject(meta({ origin: { kind: "archive", source: "a.zip", importedAt: 1 } })), true);
  assert.equal(isImportedProject(meta({ sourceUrl: "https://github.com/a/b.git" })), true);
  assert.equal(isImportedProject(meta({ origin: { kind: "built", createdAt: 1 } })), false);
  assert.equal(isImportedProject(meta({})), false);
});

test("an owned project is changed only by its owner, who cannot hand it to someone else here", () => {
  const owned = meta({ ownerId: "alice" });
  assert.deepEqual(decideProjectOwnership(caller({ userId: "alice" }), owned, undefined), { ok: true, ownerId: "alice" });
  assert.deepEqual(decideProjectOwnership(caller({ userId: "alice" }), owned, "alice"), { ok: true, ownerId: "alice" });
  assert.deepEqual(decideProjectOwnership(caller({ userId: "mallory" }), owned, "mallory"), { ok: false, status: 403, error: "not_project_owner" });
  assert.deepEqual(decideProjectOwnership(caller({ userId: "alice" }), owned, "bob"), { ok: false, status: 403, error: "owner_cannot_be_transferred" });
  assert.deepEqual(decideProjectOwnership(caller({}), owned, undefined), { ok: false, status: 403, error: "not_project_owner" });
});

test("an unowned project is claimed only by a signed-in caller for themselves; admins may set any owner", () => {
  assert.deepEqual(decideProjectOwnership(caller({ userId: "alice" }), meta({}), "alice"), { ok: true, ownerId: "alice" });
  assert.deepEqual(decideProjectOwnership(caller({ userId: "alice" }), null, undefined), { ok: true, ownerId: "alice" });
  assert.deepEqual(decideProjectOwnership(caller({ userId: "mallory" }), meta({}), "alice"), { ok: false, status: 403, error: "owner_must_be_the_caller" });
  assert.deepEqual(decideProjectOwnership(caller({}), meta({}), "alice"), { ok: false, status: 403, error: "sign_in_required" });
  assert.deepEqual(decideProjectOwnership(caller({ userId: "root", adminTools: true, role: "super_admin" }), meta({ ownerId: "alice" }), "bob"), { ok: true, ownerId: "bob" });
});

test("a metadata merge never erases a field it was not given", () => {
  assert.deepEqual(definedOnly({ ownerId: undefined, teamId: "t", createdBy: undefined }), { teamId: "t" });
  const stored = { ownerId: "alice", teamId: "t1" };
  assert.deepEqual({ ...stored, ...definedOnly({ ownerId: undefined, teamId: "t2" }) }, { ownerId: "alice", teamId: "t2" });
});
