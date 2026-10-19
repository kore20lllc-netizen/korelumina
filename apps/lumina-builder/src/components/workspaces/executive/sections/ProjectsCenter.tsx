import { FolderGit2 } from "lucide-react";

import { LuminaFlagshipCard } from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import { projects } from "../design/executiveDesignPreview";
import { ExecutiveSection, tonePill } from "../shared/ExecutiveSection";

export function ProjectsCenter() {
  return (
    <ExecutiveSection
      id="executive-projects"
      icon={FolderGit2}
      eyebrow="Projects"
      title="Every managed project"
      description="Health, runtime, framework, repository, deployments, engineering status, active mission, and related knowledge."
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
