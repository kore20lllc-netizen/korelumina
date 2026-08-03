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
  KnowledgeCapsuleFilters,
} from "./KnowledgeCapsuleFilters";

import type {
  KnowledgeCapsuleModel,
} from "./types";

type KnowledgeCapsuleFlowEngineProps = {
  capsules: KnowledgeCapsuleModel[];
  selectedCapsuleId: string;
  onCapsuleSelect: (capsuleId: string) => void;
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
  onCapsuleSelect,
}: KnowledgeCapsuleFlowEngineProps) {
  const [
    filters,
    setFilters,
  ] = useState<Record<string, string[]>>({});

  const filteredCapsules = useMemo(() => {
    const activeValues =
      Object.values(filters).flat();

    if (activeValues.length === 0) {
      return capsules;
    }

    return capsules.filter((capsule) => {
      const haystack = [
        capsule.stage,
        capsule.authority,
        capsule.approval,
        capsule.packageType,
        capsule.mission,
        capsule.conversation,
        capsule.compiler,
        capsule.owner,
        capsule.educationalModule,
        capsule.consumer,
        capsule.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return activeValues.every((value) =>
        haystack.includes(value.toLowerCase()),
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
      className="overflow-hidden rounded-[30px] border border-blue-400/70 ring-1 ring-inset ring-cyan-300/20 shadow-[0_0_0_1px_rgba(59,130,246,.16),0_0_24px_rgba(37,99,235,.18),inset_0_0_18px_rgba(56,189,248,.05)] bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(139,92,246,.13),transparent_30%),linear-gradient(135deg,rgba(2,6,23,.82),rgba(12,8,34,.78),rgba(2,10,30,.82))] shadow-[0_28px_90px_rgba(2,6,23,.46),inset_0_1px_0_rgba(255,255,255,.06)]"
    >
      <header className="border-b border-blue-400/50 ring-1 ring-inset ring-cyan-300/12 p-5 sm:p-6">
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

          <div className="rounded-[18px] border border-blue-400/55 ring-1 ring-inset ring-cyan-300/14 bg-cyan-300/[0.05] px-4 py-3">
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
        <div className="relative overflow-hidden rounded-[28px] border border-blue-400/55 ring-1 ring-inset ring-cyan-300/14 bg-[radial-gradient(circle_at_48%_0%,rgba(34,211,238,.10),transparent_30%),radial-gradient(circle_at_88%_72%,rgba(139,92,246,.10),transparent_32%),linear-gradient(145deg,rgba(3,10,30,.90),rgba(10,8,35,.86),rgba(3,13,34,.90))] p-4 shadow-[0_28px_80px_rgba(2,6,23,.42),inset_0_1px_0_rgba(255,255,255,.05)] sm:p-5">
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
                  "border-blue-400/55 ring-1 ring-inset ring-cyan-300/14 bg-cyan-300/[0.025]",
              },
              {
                id: "transformation",
                label: "Knowledge Transformation",
                detail: "Compiled material is normalized into the Knowledge Intermediate Representation.",
                stations: [
                  "Knowledge IR",
                ],
                classes:
                  "border-blue-400/52 ring-1 ring-inset ring-cyan-300/12 bg-violet-300/[0.03]",
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
                  "border-amber-300/22 bg-amber-300/[0.025]",
              },
              {
                id: "canonical",
                label: "Canonical Knowledge",
                detail: "Manufacturing terminates when the governed capsule becomes an immutable organizational asset.",
                stations: [
                  "Canonical Knowledge",
                ],
                classes:
                  "border-emerald-300/24 bg-emerald-300/[0.025]",
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
                    "relative overflow-hidden rounded-[24px] border p-4 sm:p-5",
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

                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/55 ring-1 ring-inset ring-cyan-300/14 bg-cyan-300/[0.045] px-3 py-1.5 text-[10px] font-semibold text-cyan-100">
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
                              "group relative min-h-[210px] overflow-hidden rounded-[20px] border p-4",
                              "border-blue-400/50 ring-1 ring-inset ring-cyan-300/12 bg-[linear-gradient(160deg,rgba(8,19,44,.80),rgba(7,11,29,.72))]",
                              "shadow-[inset_0_1px_0_rgba(255,255,255,.045)]",
                              "transition-[border-color,box-shadow,transform] duration-200",
                              "hover:-translate-y-0.5 hover:border-cyan-300/34 hover:shadow-[0_18px_42px_rgba(2,6,23,.34)]",
                              "motion-reduce:transition-none",
                            ].join(" ")}
                          >
                            <div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/42 to-transparent"
                            />

                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/55">
                                  Node {String(stationIndex + 1).padStart(2, "0")}
                                </div>

                                <h3 className="mt-2 text-sm font-semibold leading-5 text-sky-100">
                                  {station}
                                </h3>
                              </div>

                              <div className="rounded-full border border-blue-400/48 bg-cyan-300/[0.045] px-2.5 py-1 text-[9px] font-semibold text-cyan-100">
                                {totalOccupancy}
                              </div>
                            </div>

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
                                        "relative overflow-hidden rounded-[18px] border p-2.5",
                                        branch.kind ===
                                        "remediation"
                                          ? "border-rose-300/36 bg-rose-300/[0.055]"
                                          : "border-emerald-300/32 bg-emerald-300/[0.045]",
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
                                <div className="flex min-h-[96px] items-center justify-center rounded-[16px] border border-dashed border-cyan-300/12 bg-cyan-300/[0.015] px-4 text-center text-[10px] leading-5 text-sky-500/48">
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
