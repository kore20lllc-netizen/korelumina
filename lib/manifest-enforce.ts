export interface ManifestGateInput {
  workspaceId: string;
  projectId: string;
}

/**
 * Enforces that a workspace + project exist.
 * This is a guard — not a file path validator.
 */
export function enforceManifestGate(input: ManifestGateInput): void {
  if (!input) {
    throw new Error("Manifest gate: missing input");
  }

  const { workspaceId, projectId } = input;

  if (!workspaceId || typeof workspaceId !== "string") {
    throw new Error("Manifest gate: invalid workspaceId");
  }

  if (!projectId || typeof projectId !== "string") {
    throw new Error("Manifest gate: invalid projectId");
  }
}
