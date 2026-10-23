import type {
  RuntimeCaller,
} from "./runtimeCaller.js";

import type {
  ProjectMetadata,
} from "../projects/projectMetadataStore.js";

import { supabaseTokenConfigFromEnvironment } from "./supabaseAccessToken.js";

/*
 * Projects from before owners were recorded have no owner. They used to be
 * open to every caller outside production, which let any signed-in
 * customer see and change them. Now they are open only on a machine with
 * no identity provider (local development with the mock sign-in), or where
 * LUMINA_ALLOW_OWNERLESS_PROJECTS=true says so; otherwise only staff reach
 * them, and an admin assigns their owner.
 */
function isLocalDevelopmentRuntime(): boolean {
  if (process.env.LUMINA_ALLOW_OWNERLESS_PROJECTS === "true") return true;
  return process.env.NODE_ENV !== "production" && !supabaseTokenConfigFromEnvironment().url;
}

function isOwnerlessLegacyProject(
  metadata: ProjectMetadata | null,
): boolean {
  return Boolean(
    metadata &&
      !metadata.ownerId &&
      !metadata.teamId &&
      metadata.visibility === "private",
  );
}

export function canViewProject(
  caller: RuntimeCaller,
  metadata: ProjectMetadata | null,
): boolean {
  if (
    caller.adminTools ||
    caller.supportAccess
  ) {
    return true;
  }

  if (!metadata) {
    return false;
  }

  if (
    isLocalDevelopmentRuntime() &&
    isOwnerlessLegacyProject(metadata)
  ) {
    return true;
  }

  if (
    metadata.ownerId &&
    caller.userId ===
      metadata.ownerId
  ) {
    return true;
  }

  if (
    metadata.teamId &&
    caller.teamId &&
    metadata.teamId ===
      caller.teamId
  ) {
    return true;
  }

  return false;
}

export function canManageProject(
  caller: RuntimeCaller,
  metadata: ProjectMetadata | null,
): boolean {
  if (
    caller.adminTools
  ) {
    return true;
  }

  if (!metadata) {
    return false;
  }

  if (
    isLocalDevelopmentRuntime() &&
    isOwnerlessLegacyProject(metadata)
  ) {
    return true;
  }

  return (
    metadata.ownerId ===
    caller.userId
  );
}
