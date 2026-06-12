import { publishRuntimeEvent } from "./eventBus.js";

export function publishFileChanged(payload: {
  projectId?: string;
  file?: string;
  sha256?: string;
}) {
  if (!payload.projectId || !payload.file) {
    return;
  }

  publishRuntimeEvent({
    type: "runtime:file-changed",
    projectId: payload.projectId,
    file: payload.file,
    sha256: payload.sha256,
    timestamp: Date.now(),
  });
}
