import type { RuntimeCaller } from "../routes/runtimeCaller.js";
import type { ProjectMetadata } from "./projectMetadataStore.js";

/*
 * MS-2026-0013: who may set a project's owner, team and visibility.
 *
 * The browser used to send any ownerId it liked, so anyone reaching
 * Runtime could take a project over. Now:
 * - an admin may change anything;
 * - a project with an owner can only be changed by that owner, and its
 *   owner is not transferred here;
 * - a project without an owner is assigned one by an admin only.
 */

export type OwnershipDecision =
  | { ok: true; ownerId: string | undefined }
  | { ok: false; status: number; error: string };

export function decideProjectOwnership(
  caller: RuntimeCaller,
  existing: ProjectMetadata | null,
  requestedOwnerId: string | undefined,
): OwnershipDecision {
  if (caller.adminTools) {
    return { ok: true, ownerId: requestedOwnerId ?? existing?.ownerId ?? caller.userId };
  }
  if (existing?.ownerId) {
    if (existing.ownerId !== caller.userId) return { ok: false, status: 403, error: "not_project_owner" };
    if (requestedOwnerId && requestedOwnerId !== existing.ownerId) {
      return { ok: false, status: 403, error: "owner_cannot_be_transferred" };
    }
    return { ok: true, ownerId: existing.ownerId };
  }
  /*
   * A project without an owner was imported before owners were recorded,
   * or by a signed-out caller. Anyone claiming it could take over someone
   * else's code, so only an admin assigns its owner. (An import records its
   * importer as the owner, so a new project never needs claiming.)
   */
  return { ok: false, status: 403, error: "project_has_no_owner_ask_an_admin" };
}

/* Copy only the keys that have values, so a merge never erases a field. */
export function definedOnly<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
}
