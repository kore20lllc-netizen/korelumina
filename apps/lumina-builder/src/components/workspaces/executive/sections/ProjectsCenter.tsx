import { FolderGit2 } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import { projects as platformPreview, type PreviewTone } from "../design/executiveDesignPreview";
import { ExecutiveSection, tonePill } from "../shared/ExecutiveSection";
import { useExecutiveOffice } from "../state/useExecutiveOffice";

/*
 * EW-3: partly wired. The KoreLumina platform card reads its runtime and
 * canonical knowledge live; its findings and mission are still preview.
 * Every project imported into the Runtime is listed live with its state.
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
  const platform = platformPreview[0];
  const runtimeOnline = [office.operations, office.activation, office.learning].some((read) => read.status === "ok");
  const canonical = office.knowledge.status === "ok" ? `${office.knowledge.data.canonicalItems} canonical items` : "Reading…";

  const projects: ProjectCard[] = [
    {
      ...platform,
      runtime: runtimeOnline ? "Runtime online" : "Runtime not answering",
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
      wiring="partial"
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
