declare module "@/runtime/preview-manager" {
  export interface PreviewRuntime {
    projectId: string;
    framework: string;
    port: number;
    pid?: number;
    startedAt?: number;
    process?: unknown;
  }

  export function startProject(
    projectId: string
  ): Promise<PreviewRuntime>;

  export function getProject(
    projectId: string
  ): PreviewRuntime | null;

  export function stopProject(
    projectId: string
  ): boolean;
}
