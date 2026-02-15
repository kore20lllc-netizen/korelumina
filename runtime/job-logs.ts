type LogLine = {
  ts: string;
  line: string;
};

const logBuffers = new Map<string, LogLine[]>();
const MAX_LINES = 2000;

export function appendLog(jobId: string, line: string) {
  const arr = logBuffers.get(jobId) ?? [];
  arr.push({ ts: new Date().toISOString(), line });

  if (arr.length > MAX_LINES) {
    arr.splice(0, arr.length - MAX_LINES);
  }

  logBuffers.set(jobId, arr);
}

export function getLogs(jobId: string) {
  return logBuffers.get(jobId) ?? [];
}

export function clearLogs(jobId: string) {
  logBuffers.delete(jobId);
}
