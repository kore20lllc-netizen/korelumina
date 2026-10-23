import type { ProjectRow } from "../state/useProjectsView";

/* MS-2026-0011: how a project's origin reads, from what Runtime recorded. */

const PROVIDER: Record<string, string> = { github: "GitHub", gitlab: "GitLab", bitbucket: "Bitbucket", "azure-devops": "Azure DevOps", git: "Git" };

export function originLabel(origin: ProjectRow["origin"]): { label: string; detail: string | null } {
  switch (origin.kind) {
    case "git": {
      let path: string | null = null;
      try {
        path = new URL(origin.source).pathname.replace(/^\/+|\.git$/g, "") || null;
      } catch {
        path = null;
      }
      return { label: `Imported from ${PROVIDER[origin.provider] ?? origin.provider}`, detail: path };
    }
    case "archive":
      return { label: "Uploaded archive", detail: origin.source };
    case "built":
      return { label: "Built in KoreLumina", detail: null };
    default:
      return { label: "Origin not recorded", detail: null };
  }
}
