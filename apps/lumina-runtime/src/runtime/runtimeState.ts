type PreviewChangeType = "change" | "add" | "unlink";

type RuntimeStateRecord = {
  projectId: string;
  status?: string;
  healthy?: boolean;
  lastPreviewChangeAt?: number;
  lastPreviewChangePath?: string;
  lastPreviewChangeType?: PreviewChangeType;
};

const state = new Map<string, RuntimeStateRecord>();

function getOrCreate(projectId: string): RuntimeStateRecord {
  const existing = state.get(projectId);
  if (existing) return existing;

  const created: RuntimeStateRecord = { projectId };
  state.set(projectId, created);
  return created;
}

export const runtimeState = {
  initState(projectId: string, status?: string) {
    const record = getOrCreate(projectId);
    record.status = status;
    state.set(projectId, record);
    return record;
  },

  updateHealth(projectId: string, healthy: boolean) {
    const record = getOrCreate(projectId);
    record.healthy = healthy;
    state.set(projectId, record);
    return record;
  },

  recordPreviewChange(
    projectId: string,
    relativePath: string,
    type: PreviewChangeType
  ) {
    const record = getOrCreate(projectId);
    record.lastPreviewChangeAt = Date.now();
    record.lastPreviewChangePath = relativePath;
    record.lastPreviewChangeType = type;
    state.set(projectId, record);
    return record;
  },

  removeState(projectId: string) {
    state.delete(projectId);
  },

  getState(projectId: string) {
    return state.get(projectId);
  },

  getAllStates() {
    return Array.from(state.values());
  },
};
