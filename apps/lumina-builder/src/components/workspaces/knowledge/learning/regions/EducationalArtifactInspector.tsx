import {
  GitBranch,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  cn,
} from "@/lib/utils";

import type {
  EducationalArtifact,
} from "../model";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  FlagshipTabs,
  flagshipAppearance,
} from "../presentation";

interface EducationalArtifactInspectorProps {
  artifact: EducationalArtifact | null;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5 border-b border-cyan-300/14 py-3.5 last:border-b-0",
        "transition-colors duration-200 hover:bg-cyan-300/[0.025]",
        "motion-reduce:transition-none",
      )}
    >
      <div className={flagshipAppearance.governanceLabel}>
        {label}
      </div>

      <div className="text-xs leading-5 text-sky-200/84">
        {value}
      </div>
    </div>
  );
}

function ItemList({
  items,
  emptyLabel,
}: {
  items: string[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div
        className="
          rounded-[18px] border border-dashed border-blue-400/56
          bg-slate-950/34 px-4 py-5
          text-xs leading-5 text-sky-500/68
          ring-1 ring-inset ring-cyan-300/14
          shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
        "
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={item}
          className="
            rounded-[18px] border border-blue-400/56
            bg-slate-950/34 px-4 py-3
            text-xs leading-5 text-sky-200/80
            ring-1 ring-inset ring-cyan-300/14
            shadow-[inset_0_1px_0_rgba(186,230,253,0.05),0_0_16px_rgba(37,99,235,0.08)]
            transition-[border-color,background-color,box-shadow] duration-200
            hover:border-cyan-200/72 hover:bg-cyan-300/[0.04]
            hover:ring-blue-300/44
            hover:shadow-[inset_0_1px_0_rgba(186,230,253,0.06),0_0_18px_rgba(37,99,235,0.10),0_8px_20px_rgba(2,6,23,0.18)]
            motion-reduce:transition-none
          "
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function InspectorSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="text-[10px] font-semibold uppercase tracking-[0.19em] text-violet-300/84">
        Inspector intelligence
      </div>

      <h3
        className="
          mt-2 text-base font-semibold tracking-[-0.015em]
          text-amber-500
          drop-shadow-[0_0_16px_rgba(180,83,9,0.16)]
        "
      >
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-sky-500/76">
        {description}
      </p>

      <div
        className="
          mt-5 overflow-hidden rounded-[18px]
          border border-blue-400/56
          bg-slate-950/34 p-5
          ring-1 ring-inset ring-cyan-300/14
          shadow-[inset_0_2px_8px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(186,230,253,0.06),0_0_16px_rgba(37,99,235,0.08)]
        "
      >
        {children}
      </div>
    </section>
  );
}

export function EducationalArtifactInspector({
  artifact,
}: EducationalArtifactInspectorProps) {
  const [
    activeTab,
    setActiveTab,
  ] = useState("overview");

  return (
    <LuminaFlagshipPanel
      title="Educational Artifact Inspector"
      description="Authority • Provenance • Lineage • Educational impact"
      emphasis="strong"
      className="min-h-[44rem]"
    >
      {artifact === null ? (
        <div className="flex min-h-[36rem] items-center justify-center p-6 text-center">
          <div className="max-w-sm">
            <div className="mx-auto w-fit">
              <ExecutivePremiumIcon
                icon={GitBranch}
                state="active"
              />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-amber-500">
              Select an educational artifact
            </h3>

            <p className="mt-2 text-sm leading-6 text-sky-500/76">
              Choose a curriculum item, Genesis source or timeline event to inspect its complete educational contract.
            </p>
          </div>
        </div>
      ) : (
        <FlagshipTabs
          tabs={[
            "overview",
            "authority",
            "provenance",
            "lineage",
            "dependencies",
            "versions",
            "impact",
            "governance",
            "related",
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        >
          <div className="p-5 sm:p-6">
            {activeTab === "overview" && (
              <InspectorSection
                title="Executive Summary"
                description={artifact.scope}
              >
                <DetailRow
                  label="Educational purpose"
                  value={artifact.educationalImpact}
                />
                <DetailRow
                  label="Owner"
                  value={artifact.owner}
                />
                <DetailRow
                  label="Version"
                  value={artifact.version}
                />
                <DetailRow
                  label="Supersession"
                  value={artifact.supersession}
                />
                {artifact.authors ? (
                  <DetailRow
                    label="Authors"
                    value={artifact.authors.join(" • ")}
                  />
                ) : null}
              </InspectorSection>
            )}

            {activeTab === "authority" && (
              <InspectorSection
                title="Authority"
                description="Constitutional position, approval state, ownership and scope"
              >
                <DetailRow
                  label="Authority class"
                  value={artifact.authorityClass}
                />
                <DetailRow
                  label="Approval state"
                  value={artifact.approvalState}
                />
                <DetailRow
                  label="Ownership"
                  value={artifact.owner}
                />
                <DetailRow
                  label="Scope"
                  value={artifact.scope}
                />
              </InspectorSection>
            )}

            {activeTab === "provenance" && (
              <InspectorSection
                title="Provenance"
                description="Source identity, origin and educational admission trail"
              >
                <DetailRow
                  label="Provenance"
                  value={artifact.provenance}
                />
                <DetailRow
                  label="Source"
                  value={artifact.source}
                />
              </InspectorSection>
            )}

            {activeTab === "lineage" && (
              <InspectorSection
                title="Lineage"
                description="Educational, constitutional and architectural continuity"
              >
                <ItemList
                  items={artifact.lineage}
                  emptyLabel="No lineage recorded."
                />
              </InspectorSection>
            )}

            {activeTab === "dependencies" && (
              <InspectorSection
                title="Dependencies"
                description="Prerequisite educational assets and dependency gates"
              >
                <ItemList
                  items={artifact.dependencies}
                  emptyLabel="No prerequisite educational dependencies."
                />
              </InspectorSection>
            )}

            {activeTab === "versions" && (
              <InspectorSection
                title="Version History"
                description="Current version and supersession posture"
              >
                <DetailRow
                  label="Current version"
                  value={artifact.version}
                />
                <DetailRow
                  label="Supersession status"
                  value={artifact.supersession}
                />
              </InspectorSection>
            )}

            {activeTab === "impact" && (
              <InspectorSection
                title="Educational Impact"
                description="Contribution to modules, competency and activation readiness"
              >
                <DetailRow
                  label="Educational impact"
                  value={artifact.educationalImpact}
                />
                <DetailRow
                  label="Educational status"
                  value={artifact.educationalStatus}
                />
              </InspectorSection>
            )}

            {activeTab === "governance" && (
              <InspectorSection
                title="Governance"
                description="Approval, authority, ownership and supersession controls"
              >
                <DetailRow
                  label="Approval"
                  value={artifact.approvalState}
                />
                <DetailRow
                  label="Authority"
                  value={artifact.authorityClass}
                />
                <DetailRow
                  label="Owner"
                  value={artifact.owner}
                />
              </InspectorSection>
            )}

            {activeTab === "related" && (
              <InspectorSection
                title="Related Artifacts"
                description="Knowledge Packages, Canonical Knowledge, Organizational Memory, missions and decisions"
              >
                <ItemList
                  items={[
                    ...artifact.relatedArtifacts,
                    ...artifact.relatedKnowledgePackages,
                    ...artifact.relatedCanonicalKnowledge,
                    ...artifact.relatedMemory,
                    ...artifact.relatedMissions,
                    ...artifact.relatedDecisions,
                  ]}
                  emptyLabel="No related governed assets."
                />
              </InspectorSection>
            )}
          </div>
        </FlagshipTabs>
      )}
    </LuminaFlagshipPanel>
  );
}
