import { FolderGit2 } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import type { PreviewTone } from "../design/executiveDesignPreview";
import { ExecutiveSection, tonePill } from "../shared/ExecutiveSection";
import { platformHealth } from "../state/executiveHealth";
import { currentMission } from "../state/missionView";
import { useExecutiveOffice } from "../state/useExecutiveOffice";

/*
 * EW-3: the KoreLumina platform card and every project imported into the
 * Runtime, listed live with their state.
 *
 * MS-2026-0004 (E3.T1): the platform card reads the repository (branch and
 * latest commit), each workspace's stack, the activation certifications,
 * and the current mission from Runtime. No deployment is recorded yet, so
 * it says so.
 */
type ProjectCard = {
  name: string;
  repository: string;
  framework: string;
  runtime: string;
  health: string;
  tone: PreviewTone;
  deployments: string;
  mission: string;
  knowledge: string;
};

export function ProjectsCenter() {
  const office = useExecutiveOffice();
  const facts = office.platform.status === "ok" ? office.platform.data : null;
  const health = platformHealth(office);
  const mission = office.missions.status === "ok" ? currentMission(office.missions.data) : null;
  const unread = office.platform.status === "error" ? "Unreadable" : "Reading…";
  const runtimeOnline = [office.operations, office.activation, office.learning].some((read) => read.status === "ok");
  const canonical = office.knowledge.status === "ok" ? `${office.knowledge.data.canonicalItems} canonical items` : "Reading…";

  const projects: ProjectCard[] = [
    {
      name: "KoreLumina platform",
      repository: facts
        ? [facts.repository ?? "No origin remote", facts.branch, facts.head ? `at ${facts.head.sha.slice(0, 8)}` : null].filter(Boolean).join(" · ")
        : unread,
      framework: facts
        ? facts.workspaces
            .filter((workspace) => workspace.path.startsWith("apps/"))
            .map((workspace) => `${workspace.name}: ${workspace.stack.join(", ") || "no known stack"}`)
            .join(" · ") || "No app workspaces"
        : unread,
      runtime: runtimeOnline ? "Runtime online" : "Runtime not answering",
      health: health.value === "Reading…" || health.value === "Unreadable" ? health.value : `${health.value} certifications`,
      tone: health.tone,
      deployments: "None recorded",
      mission: office.missions.status === "ok" ? (mission ? `${mission.id} · ${mission.title}` : "None") : "Reading…",
      knowledge: canonical,
    },
    ...(office.projects.status === "ok"
      ? office.projects.data.map((project) => ({
          name: project.projectId,
          repository: "Imported into the Runtime",
          framework: project.framework ?? (project.hasPackageJson ? "Node project (not started yet)" : "Unknown"),
          runtime: project.running ? project.url ?? "Running" : "Stopped",
          health: project.running ? "Running" : "Stopped",
          tone: (project.running ? "healthy" : "active") as PreviewTone,
          deployments: "None recorded",
          mission: "None",
          knowledge: "No project memory yet",
        }))
      : []),
  ];

  return (
    <ExecutiveSection
      id="executive-projects"
      icon={FolderGit2}
      eyebrow="Projects"
      title="Every managed project"
      description="Health, runtime, framework, repository, deployments, engineering status, active mission, and related knowledge."
      wiring="live"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <LuminaFlagshipCard key={project.name} as="article" className="rounded-[20px] p-4">
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="text-lg font-semibold text-amber-300">{project.name}</div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tonePill[project.tone]}`}>{project.health}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Repository", project.repository],
                  ["Framework", project.framework],
                  ["Runtime", project.runtime],
                  ["Deployments", project.deployments],
                  ["Active mission", project.mission],
                  ["Knowledge", project.knowledge],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sky-300/60">{label}</dt>
                    <dd className="mt-0.5 text-sky-100/80">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </LuminaFlagshipCard>
        ))}
      </div>
    </ExecutiveSection>
  );
}
