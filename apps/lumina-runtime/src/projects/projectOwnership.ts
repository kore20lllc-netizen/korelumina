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
 * - a project without an owner can be claimed only by a signed-in caller,
 *   for themselves.
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
  if (!caller.userId) return { ok: false, status: 403, error: "sign_in_required" };
  if (requestedOwnerId && requestedOwnerId !== caller.userId) {
    return { ok: false, status: 403, error: "owner_must_be_the_caller" };
  }
  return { ok: true, ownerId: caller.userId };
}

/* Copy only the keys that have values, so a merge never erases a field. */
export function definedOnly<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
}
