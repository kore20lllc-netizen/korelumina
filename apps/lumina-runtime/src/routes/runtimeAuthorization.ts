import type {
  RuntimeCaller,
} from "./runtimeCaller.js";

import type {
  ProjectMetadata,
} from "../projects/projectMetadataStore.js";

function isLocalDevelopmentRuntime(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.LUMINA_ALLOW_OWNERLESS_PROJECTS === "true"
  );
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
