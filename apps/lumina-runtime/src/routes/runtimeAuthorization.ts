import type {
  RuntimeCaller,
} from "./runtimeCaller.js";

import type {
  ProjectMetadata,
} from "../projects/projectMetadataStore.js";

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

  return (
    metadata.ownerId ===
    caller.userId
  );
}
