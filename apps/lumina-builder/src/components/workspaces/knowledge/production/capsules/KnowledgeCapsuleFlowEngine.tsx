import {
  CircleAlert,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  KnowledgeCapsule,
} from "./KnowledgeCapsule";

import {
  emptyKnowledgeCapsuleFilters,
  KnowledgeCapsuleFilters,
} from "./KnowledgeCapsuleFilters";

import type {
  KnowledgeCapsuleFilterState,
} from "./KnowledgeCapsuleFilters";

import {
  flagshipAppearance,
} from "../../learning/presentation/flagshipAppearance";

import type {
  KnowledgeCapsuleModel,
} from "./types";

type KnowledgeCapsuleFlowEngineProps = {
  capsules: KnowledgeCapsuleModel[];
  selectedCapsuleId: string;
  selectedStationId?: string;
  onCapsuleSelect: (capsuleId: string) => void;
  onStationSelect: (stationId: string) => void;
};

import {
  capsuleManufacturingPositions,
  manufacturingStations,
} from "./lifecycle";

const stations =
  manufacturingStations;

const stateByStation: Record<
  (typeof stations)[number],
  KnowledgeCapsuleModel["state"]
> = {
  "Evidence Intake": "queued",
  "Documentation Compiler": "processing",
  "Conversation Compiler": "processing",
  "Git Compiler": "processing",
  "Runtime Compiler": "processing",
  "Mission Compiler": "processing",
  "Execution Compiler": "processing",
  "Knowledge IR": "processing",
  Validation: "needs-review",
  "Knowledge Package Assembly": "validated",
  "Canonical Review": "needs-review",
  "Canonical Knowledge": "approved",
};

export function KnowledgeCapsuleFlowEngine({
  capsules,
  selectedCapsuleId,
  selectedStationId,
  onCapsuleSelect,
  onStationSelect,
}: KnowledgeCapsuleFlowEngineProps) {
  const [
    filters,
    setFilters,
  ] = useState<KnowledgeCapsuleFilterState>(
    emptyKnowledgeCapsuleFilters,
  );

  const filteredCapsules = useMemo(() => {
    const matchesConfidence = (
      confidence: number,
    ) => {
      switch (filters.confidence) {
        case "90–100%":
          return confidence >= 90;
        case "75–89%":
          return confidence >= 75 && confidence <= 89;
        case "Below 75%":
          return confidence < 75;
        default:
          return true;
      }
    };

    return capsules.filter((capsule) => {
      return (
        (!filters.stage ||
          capsule.stage === filters.stage) &&
        (!filters.authority ||
          capsule.authority === filters.authority) &&
        (!filters.approval ||
          capsule.approval === filters.approval) &&
        (!filters.packageType ||
          capsule.packageType === filters.packageType) &&
        (!filters.mission ||
          capsule.title === filters.mission ||
          capsule.mission === filters.mission) &&
        (!filters.conversation ||
          capsule.title === filters.conversation ||
          capsule.conversation === filters.conversation) &&
        (!filters.compiler ||
          capsule.compiler === filters.compiler) &&
        (!filters.owner ||
          capsule.owner === filters.owner) &&
        (!filters.educationalModule ||
          capsule.educationalModule ===
            filters.educationalModule) &&
        (!filters.consumer ||
          capsule.consumer === filters.consumer) &&
        (!filters.status ||
          capsule.state === filters.status) &&
        matchesConfidence(capsule.confidence)
      );
    });
  }, [
    capsules,
    filters,
  ]);

  const selectedCapsule = useMemo(
    () =>
      filteredCapsules.find(
        (capsule) =>
          capsule.id === selectedCapsuleId,
      ) ??
      filteredCapsules[0] ??
      capsules[0],
    [
      capsules,
      filteredCapsules,
      selectedCapsuleId,
    ],
  );

  const capsuleById = useMemo(
    () =>
      new Map(
        capsules.flatMap((capsule) => [
          [
            capsule.id.toLowerCase(),
            capsule,
          ] as const,
          [
            capsule.identity.toLowerCase(),
            capsule,
          ] as const,
        ]),
      ),
    [capsules],
  );

  const occupancyByStation = useMemo(() => {
    return manufacturingStations.map(
      (station) => {
        const positions =
          capsuleManufacturingPositions.filter(
            (position) =>
              position.station === station,
          );

        const branchPositions =
          capsuleManufacturingPositions.flatMap(
            (position) =>
              position.branches.filter(
                (branch) =>
                  branch.station === station,
              ),
          );

        return {
          station,
          positions,
          branchPositions,
        };
      },
    );
  }, []);

  return (
    <section
      aria-label="Knowledge Capsule Flow Engine"
      className={
        flagshipAppearance.capsuleFlowShell
      }
    >
      <header
        className={
          flagshipAppearance.capsuleFlowHeader
        }
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/72">
              Knowledge Operations
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-amber-400">
              Knowledge Capsule Flow Engine
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-300/76">
              One persistent Knowledge Package moves through the governed lifecycle.
              Its identity remains stable while its station, state, integrity and
              authority posture change.
            </p>
          </div>

          <div
            className={
              flagshipAppearance.capsuleFlowMetric
            }
          >
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-300/66">
              Live manufacturing posture
            </div>

            <div className="mt-1 text-sm font-semibold text-cyan-100">
              Multi-capsule station occupancy
            </div>

            <div className="mt-1 text-xs text-sky-500/72">
              Fixture-driven UI contract
            </div>
          </div>
        </div>

        <div className="mt-5">
          <KnowledgeCapsuleFilters
            capsules={capsules}
            filters={filters}
            onFiltersChange={setFilters}
            resultCount={filteredCapsules.length}
          />
        </div>
      </header>

      <div className="p-5 sm:p-6">
        <div
          className={
            flagshipAppearance.capsuleFlowCanvas
          }
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(125,211,252,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.045)_1px,transparent_1px)] [background-size:34px_34px]"
          />

          <div className="relative grid gap-5">
            {[
              {
                id: "source",
                label: "Source Intake",
                detail: "Evidence and operational sources enter the governed manufacturing system.",
                stations: [
                  "Evidence Intake",
                  "Documentation Compiler",
                  "Conversation Compiler",
                  "Git Compiler",
                  "Runtime Compiler",
                  "Mission Compiler",
                  "Execution Compiler",
                ],
                classes:
                  flagshipAppearance.capsuleFlowZoneTone.source,
              },
              {
                id: "transformation",
                label: "Knowledge Transformation",
                detail: "Compiled material is normalized into the Knowledge Intermediate Representation.",
                stations: [
                  "Knowledge IR",
                ],
                classes:
                  flagshipAppearance.capsuleFlowZoneTone.transformation,
              },
              {
                id: "governance",
                label: "Governance & Assembly",
                detail: "Validation, exception handling, package assembly and canonical review.",
                stations: [
                  "Validation",
                  "Knowledge Package Assembly",
                  "Canonical Review",
                ],
                classes:
                  flagshipAppearance.capsuleFlowZoneTone.governance,
              },
              {
                id: "canonical",
                label: "Canonical Knowledge",
                detail: "Manufacturing terminates when the governed capsule becomes an immutable organizational asset.",
                stations: [
                  "Canonical Knowledge",
                ],
                classes:
                  flagshipAppearance.capsuleFlowZoneTone.canonical,
              },
            ].map((zone, zoneIndex) => {
              const stationRecords =
                zone.stations
                  .map((station) =>
                    occupancyByStation.find(
                      (record) =>
                        record.station === station,
                    ),
                  )
                  .filter(Boolean);

              const zoneOccupancy =
                stationRecords.reduce(
                  (total, record) =>
                    total +
                    record.positions.length +
                    record.branchPositions.length,
                  0,
                );

              return (
                <section
                  key={zone.id}
                  aria-labelledby={`${zone.id}-zone-title`}
                  className={[
                    flagshipAppearance.capsuleFlowZone,
                    zone.classes,
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-300/56">
                        Zone {String(zoneIndex + 1).padStart(2, "0")}
                      </div>

                      <h2
                        id={`${zone.id}-zone-title`}
                        className="mt-2 text-lg font-semibold tracking-[-0.015em] text-amber-400"
                      >
                        {zone.label}
                      </h2>

                      <p className="mt-1 max-w-3xl text-xs leading-5 text-sky-400/68">
                        {zone.detail}
                      </p>
                    </div>

                    <div
                      className={
                        flagshipAppearance.capsuleFlowOccupancyBadge
                      }
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.75)]" />
                      {zoneOccupancy} active
                    </div>
                  </div>

                  <div
                    className={[
                      "relative mt-5 grid gap-4",
                      zone.stations.length === 1
                        ? "grid-cols-1"
                        : "md:grid-cols-2 xl:grid-cols-3",
                    ].join(" ")}
                  >
                    {stationRecords.map(
                      ({
                        station,
                        positions,
                        branchPositions,
                      }, stationIndex) => {
                        const totalOccupancy =
                          positions.length +
                          branchPositions.length;

                        return (
                          <article
                            key={station}
                            aria-label={`${station} station`}
                            className={[
                              flagshipAppearance.capsuleFlowStation,
                              "transition-[border-color,box-shadow,transform] duration-200",
                              selectedStationId === station
                                ? "ring-1 ring-inset ring-cyan-200/80 shadow-[0_0_28px_rgba(37,99,235,0.24)]"
                                : "hover:ring-1 hover:ring-inset hover:ring-cyan-300/45",
                            ].join(" ")}
                          >
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/42 to-transparent"
                            />

                            <button
                              type="button"
                              aria-pressed={selectedStationId === station}
                              onClick={() =>
                                onStationSelect(station)
                              }
                              className="flex w-full items-start justify-between gap-3 text-left"
                            >
                              <div>
                                <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/55">
                                  Node {String(stationIndex + 1).padStart(2, "0")}
                                </div>

                                <h3 className="mt-2 text-sm font-semibold leading-5 text-sky-100">
                                  {station}
                                </h3>
                              </div>

                              <div
                                className={
                                  flagshipAppearance.capsuleFlowStationCount
                                }
                              >
                                {totalOccupancy}
                              </div>
                            </button>

                            <div className="mt-4 grid gap-3">
                              {positions.map(
                                (position) => {
                                  const capsule =
                                    capsuleById.get(
                                      position.capsuleId.toLowerCase(),
                                    );

                                  if (!capsule) {
                                    return null;
                                  }

                                  return (
                                    <KnowledgeCapsule
                                      key={position.capsuleId}
                                      capsule={{
                                        ...capsule,
                                        stage: station,
                                      }}
                                      selected={
                                        capsule.id ===
                                        selectedCapsule?.id
                                      }
                                      compact
                                      onSelect={
                                        onCapsuleSelect
                                      }
                                    />
                                  );
                                },
                              )}

                              {branchPositions.map(
                                (branch) => {
                                  const parent =
                                    capsuleById.get(
                                      branch.parentCapsuleId.toLowerCase(),
                                    );

                                  if (!parent) {
                                    return null;
                                  }

                                  return (
                                    <div
                                      key={branch.id}
                                      className={[
                                        flagshipAppearance.capsuleFlowBranch,
                                        branch.kind ===
                                        "remediation"
                                          ? flagshipAppearance.capsuleFlowBranchTone.remediation
                                          : flagshipAppearance.capsuleFlowBranchTone.validated,
                                      ].join(" ")}
                                    >
                                      <div
                                        aria-hidden="true"
                                        className={[
                                          "absolute left-0 top-0 h-full w-1",
                                          branch.kind === "remediation"
                                            ? "bg-rose-300/70"
                                            : "bg-emerald-300/70",
                                        ].join(" ")}
                                      />

                                      <div className="mb-2 flex items-center justify-between gap-2 pl-1">
                                        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-sky-300/72">
                                          {branch.kind ===
                                          "remediation"
                                            ? "Remediation branch"
                                            : "Validated continuation"}
                                        </div>

                                        <div className="text-[9px] text-sky-500/62">
                                          {branch.layerIds.length} layer
                                          {branch.layerIds.length === 1
                                            ? ""
                                            : "s"}
                                        </div>
                                      </div>

                                      <KnowledgeCapsule
                                        capsule={{
                                          ...parent,
                                          stage: station,
                                          state:
                                            branch.state,
                                          integrity:
                                            branch.integrity,
                                        }}
                                        selected={
                                          parent.id ===
                                          selectedCapsule?.id
                                        }
                                        compact
                                        onSelect={
                                          onCapsuleSelect
                                        }
                                      />

                                      {branch.note ? (
                                        <p className="mt-2 pl-1 text-[10px] leading-4 text-sky-400/68">
                                          {branch.note}
                                        </p>
                                      ) : null}
                                    </div>
                                  );
                                },
                              )}

                              {totalOccupancy === 0 ? (
                                <div
                                  className={
                                    flagshipAppearance.capsuleFlowEmptyStation
                                  }
                                >
                                  Available manufacturing node
                                </div>
                              ) : null}
                            </div>

                            {stationIndex <
                            stationRecords.length - 1 ? (
                              <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-4 top-1/2 hidden h-px w-4 bg-gradient-to-r from-cyan-300/48 to-violet-300/16 xl:block"
                              />
                            ) : null}
                          </article>
                        );
                      },
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
