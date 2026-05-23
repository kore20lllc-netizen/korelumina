export type RuntimeRecord = {
  projectId: string;
  port: number;
  pid?: number;
  startedAt: number;
  url: string;
};

export const runtimeRegistry = new Map<
  string,
  RuntimeRecord
>();
