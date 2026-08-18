import {
  ActivationReadiness,
  CompetencyPosture,
  EducationalArtifactInspector,
  EducationalCorpusExplorer,
  EducationalTimeline,
} from "../regions";

import type {
  ReturnTypeOfEducationalDashboardState,
} from "./types";

interface EducationalDashboardMainProps {
  dashboard: ReturnTypeOfEducationalDashboardState;
}

export function EducationalDashboardMain({
  dashboard,
}: EducationalDashboardMainProps) {
  return (
    <div className="space-y-6">
      <section
        aria-label="Educational corpus and selected artifact"
        className="
          grid items-start gap-6
          2xl:grid-cols-[minmax(0,1.55fr)_minmax(420px,0.85fr)]
        "
      >
        <div
          id="learning-corpus-explorer"
          className="scroll-mt-32"
        >
          <EducationalCorpusExplorer
          artifacts={
            dashboard.filters.visibleArtifacts
          }
          filters={
            dashboard.filters.filters
          }
          authorityOptions={
            dashboard.filters.authorityOptions
          }
          approvalOptions={
            dashboard.filters.approvalOptions
          }
          categoryOptions={
            dashboard.filters.categoryOptions
          }
          selectedArtifactId={
            dashboard.selection.artifactId
          }
          onFilterChange={
            dashboard.filters.updateFilter
          }
          onArtifactSelect={
            dashboard.selection.setArtifactId
          }
        />
        </div>

        <div className="min-w-0 space-y-6">
          <div
            id="learning-artifact-inspector"
            className="scroll-mt-32"
          >
            <EducationalArtifactInspector
            artifact={
              dashboard.selection.selectedArtifact
            }
          />
          </div>

          <div
            id="learning-timeline"
            className="scroll-mt-32"
          >
            <EducationalTimeline
            events={
              dashboard.visibleTimeline
            }
            timelineFilter={
              dashboard.selection.timelineType
            }
            availableFilters={[
              "all",
              ...Array.from(
                new Set(
                  dashboard.timeline.map(
                    (event) => event.type,
                  ),
                ),
              ),
            ]}
            onTimelineFilterChange={
              dashboard.selection.setTimelineType
            }
            onArtifactSelect={
              dashboard.selection.setArtifactId
            }
          />
          </div>
        </div>
      </section>

      <section
        aria-label="Competency and activation readiness"
        className="
          grid items-stretch gap-6
          xl:grid-cols-2
        "
      >
        <div
          id="learning-competency"
          className="min-w-0 scroll-mt-32 [&>*]:h-full"
        >
          <CompetencyPosture
            competencies={
              dashboard.competencies
            }
          />
        </div>

        <div
          id="learning-activation"
          className="min-w-0 scroll-mt-32 [&>*]:h-full"
        >
          <ActivationReadiness />
        </div>
      </section>
    </div>
  );
}
