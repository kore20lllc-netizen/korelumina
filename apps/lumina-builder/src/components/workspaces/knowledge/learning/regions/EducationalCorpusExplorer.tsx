import {
  ChevronRight,
  Filter,
  Search,
  ChevronDown,
} from "lucide-react";

import {
  cn,
} from "@/lib/utils";

import type {
  EducationalArtifact,
  EducationalArtifactFilters,
  EducationalStatus,
} from "../model";

import {
  LuminaFlagshipCard,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipCard";

import {
  LuminaFlagshipPanel,
} from "@/components/lumina/workspace/primitives/LuminaFlagshipPanel";

import {
  FlagshipInput,
  FlagshipSelect,
  LearningStatusBadge,
  flagshipAppearance,
} from "../presentation";

interface EducationalCorpusExplorerProps {
  artifacts: EducationalArtifact[];
  filters: EducationalArtifactFilters;
  authorityOptions: string[];
  approvalOptions: string[];
  categoryOptions: string[];
  selectedArtifactId: string | null;
  onFilterChange<
    Key extends keyof EducationalArtifactFilters,
  >(
    key: Key,
    value: EducationalArtifactFilters[Key],
  ): void;
  onArtifactSelect(id: string): void;
}

function statusTone(
  status: EducationalStatus,
) {
  switch (status) {
    case "completed":
      return "complete" as const;
    case "active":
      return "active" as const;
    case "blocked":
      return "blocked" as const;
    case "needs-review":
      return "review" as const;
    default:
      return "neutral" as const;
  }
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  allLabel: string;
  onChange(value: string): void;
}) {
  return (
    <label>
      <span className="sr-only">
        {label}
      </span>

      <FlagshipSelect
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={cn(
          "w-full px-3 text-xs",
          flagshipAppearance.control,
        )}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="bg-slate-950"
          >
            {option === "all"
              ? allLabel
              : option}
          </option>
        ))}
      </FlagshipSelect>
    </label>
  );
}

export function EducationalCorpusExplorer({
  artifacts,
  filters,
  authorityOptions,
  approvalOptions,
  categoryOptions,
  selectedArtifactId,
  onFilterChange,
  onArtifactSelect,
}: EducationalCorpusExplorerProps) {
  return (
    <LuminaFlagshipPanel
      title="Educational Corpus Explorer"
      description="Governed curriculum with authority, approval, ownership, scope, version, provenance, dependencies and supersession."
      toolbar={
        <LearningStatusBadge tone="active">
          Fixture curriculum
        </LearningStatusBadge>
      }
      emphasis="strong"
    >
        <div
        className="
          grid gap-3 border-b border-cyan-300/18
          bg-slate-950/16 p-4
          lg:grid-cols-[minmax(300px,1.65fr)_repeat(3,minmax(170px,0.72fr))]
        "
      >
        <label className="relative min-w-0">
          <Search
            aria-hidden="true"
            className="
              pointer-events-none absolute left-3.5 top-1/2 z-10
              h-4 w-4 -translate-y-1/2 text-cyan-300/70
            "
          />

          <input
            value={filters.query}
            onChange={(event) => {
              onFilterChange(
                "query",
                event.target.value,
              );
            }}
            placeholder="Search title, provenance, owner, scope or identifier"
            style={{
              WebkitAppearance: "none",
              appearance: "none",
              background:
                "linear-gradient(180deg, rgba(2,6,23,0.76), rgba(8,15,38,0.60))",
              color: "rgb(224,242,254)",
              WebkitTextFillColor: "rgb(224,242,254)",
              colorScheme: "dark",
              boxShadow:
                "inset 0 3px 8px rgba(0,0,0,0.72), inset 0 1px 0 rgba(186,230,253,0.11), 0 0 0 1px rgba(103,232,249,0.14)",
            }}
            className="
              h-11 w-full rounded-[15px]
              border border-cyan-300/46
              bg-slate-950/62
              pl-10 pr-4 text-sm text-sky-100
              placeholder:text-sky-500/68
              ring-1 ring-inset ring-cyan-100/12
              shadow-[inset_0_3px_8px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(186,230,253,0.11),0_1px_0_rgba(255,255,255,0.025)]
              outline-none
              transition-[border-color,background-color,box-shadow] duration-200
              hover:border-cyan-200/68
              focus:border-cyan-100/90
              focus:bg-slate-950/76
              focus:ring-2 focus:ring-cyan-200/28
              focus:shadow-[inset_0_3px_9px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(186,230,253,0.15),0_0_22px_rgba(34,211,238,0.10)]
              motion-reduce:transition-none
            "
          />
        </label>

        {[
          {
            label: "Authority",
            value: filters.authority,
            key: "authority" as const,
            options: authorityOptions,
            allLabel: "All authority classes",
          },
          {
            label: "Approval",
            value: filters.approval,
            key: "approval" as const,
            options: approvalOptions,
            allLabel: "All approval states",
          },
          {
            label: "Category",
            value: filters.category,
            key: "category" as const,
            options: categoryOptions,
            allLabel: "All curriculum categories",
          },
        ].map((control) => (
          <label
            key={control.key}
            className="relative min-w-0"
          >
            <span className="sr-only">
              {control.label}
            </span>

            <select
              value={control.value}
              onChange={(event) => {
                onFilterChange(
                  control.key,
                  event.target.value,
                );
              }}
              style={{
                WebkitAppearance: "none",
                appearance: "none",
                background:
                  "linear-gradient(180deg, rgba(2,6,23,0.76), rgba(8,15,38,0.60))",
                color: "rgb(224,242,254)",
                WebkitTextFillColor: "rgb(224,242,254)",
                colorScheme: "dark",
                boxShadow:
                  "inset 0 3px 8px rgba(0,0,0,0.72), inset 0 1px 0 rgba(186,230,253,0.11), 0 0 0 1px rgba(103,232,249,0.14)",
              }}
              className="
                h-11 w-full appearance-none rounded-[15px]
                border border-cyan-300/46
                bg-slate-950/62
                px-4 pr-10 text-sm text-sky-100
                ring-1 ring-inset ring-cyan-100/12
                shadow-[inset_0_3px_8px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(186,230,253,0.11),0_1px_0_rgba(255,255,255,0.025)]
                outline-none
                transition-[border-color,background-color,box-shadow] duration-200
                hover:border-cyan-200/68
                focus:border-cyan-100/90
                focus:bg-slate-950/76
                focus:ring-2 focus:ring-cyan-200/28
                focus:shadow-[inset_0_3px_9px_rgba(0,0,0,0.78),inset_0_1px_0_rgba(186,230,253,0.15),0_0_22px_rgba(34,211,238,0.10)]
                motion-reduce:transition-none
              "
            >
              <option value="all">
                {control.allLabel}
              </option>

              {control.options
                .filter((option) => option !== "all")
                .map((option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {option}
                  </option>
                ))}
            </select>

            <ChevronDown
              aria-hidden="true"
              className="
                pointer-events-none absolute right-3.5 top-1/2
                h-4 w-4 -translate-y-1/2 text-cyan-300/70
              "
            />
          </label>
        ))}
      </div>

      <div
        role="status"
        aria-live="polite"
        className={cn(
          "border-b px-4 py-3",
          flagshipAppearance.divider,
          flagshipAppearance.panelMeta,
        )}
      >
        {artifacts.length} modeled educational artifacts visible
      </div>

      <div className="relative block min-h-[620px] w-full grid gap-3 p-4">
        {artifacts.length === 0 ? (
          <div
            className={cn(
              "flex min-h-[320px] items-center justify-center border-dashed px-6 text-center",
              flagshipAppearance.card,
            )}
          >
            <div className="max-w-sm">
              <div className="text-sm font-semibold text-sky-200">
                No curriculum matches the current filters
              </div>

              <div className="mt-2 text-xs leading-5 text-sky-500/72">
                Adjust search, authority, approval or category filters.
              </div>
            </div>
          </div>
        ) : (
          artifacts.map((artifact) => {
            const selected =
              artifact.id === selectedArtifactId;

            return (
              <LuminaFlagshipCard
                key={artifact.id}
                onClick={() => {
                  onArtifactSelect(
                    artifact.id,
                  );
                }}
                aria-pressed={selected}
                selected={selected}
                interactive
                className={cn(
                  "group p-4 text-left",
                  selected && [
                    "ring-1 ring-inset ring-cyan-200/38",
                    "shadow-[inset_0_1px_0_rgba(186,230,253,0.10),0_0_24px_rgba(34,211,238,0.12),0_18px_44px_rgba(2,6,23,0.30)]",
                  ].join(" "),
                )}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.08),transparent_34%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none"
                />

                <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex min-h-7 items-center rounded-full border border-cyan-300/18 bg-cyan-300/[0.045] px-2.5 py-1 text-[11px] font-medium text-cyan-100/80">
                        {artifact.category}
                      </span>

                      <LearningStatusBadge
                        tone={statusTone(
                          artifact.educationalStatus,
                        )}
                      >
                        {artifact.educationalStatus}
                      </LearningStatusBadge>

                      <span className={flagshipAppearance.metadataLabel}>
                        {artifact.version}
                      </span>
                    </div>

                    <h3 className={cn(
                      "mt-3",
                      flagshipAppearance.cardTitle,
                    )}>
                      {artifact.title}
                    </h3>

                    <p className={cn(
                      "mt-2 max-w-4xl",
                      flagshipAppearance.body,
                    )}>
                      {artifact.scope}
                    </p>

                    <div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          label: "Authority",
                          value: artifact.authorityClass,
                          governance: true,
                        },
                        {
                          label: "Approval",
                          value: artifact.approvalState,
                          governance: true,
                        },
                        {
                          label: "Owner",
                          value: artifact.owner,
                          governance: true,
                        },
                        {
                          label: "Supersession",
                          value: artifact.supersession,
                          governance: true,
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <div
                            className={
                              item.governance
                                ? flagshipAppearance.governanceLabel
                                : flagshipAppearance.metadataLabel
                            }
                          >
                            {item.label}
                          </div>

                          <div
                            className={
                              item.governance
                                ? flagshipAppearance.governanceValue
                                : flagshipAppearance.metadataValue
                            }
                          >
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      "mt-1 h-4 w-4 shrink-0 text-cyan-200/35",
                      "transition-transform duration-200",
                      "group-hover:translate-x-0.5 group-hover:text-cyan-100",
                      "motion-reduce:transition-none",
                    )}
                  />
                </div>
              </LuminaFlagshipCard>
            );
          })
        )}
      </div>
  </LuminaFlagshipPanel>
  );
}
