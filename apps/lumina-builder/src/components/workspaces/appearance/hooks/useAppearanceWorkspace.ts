export interface AppearanceWorkspaceState {
  selectedSection: string;
}

export function useAppearanceWorkspace(): AppearanceWorkspaceState {
  return {
    selectedSection: "presets",
  };
}
