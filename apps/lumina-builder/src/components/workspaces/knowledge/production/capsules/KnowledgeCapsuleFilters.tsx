import {
  useId,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  ExecutiveFilterSurface,
} from "@/components/design-system/lumina";

import {
  flagshipAppearance,
} from "../../learning/presentation/flagshipAppearance";

import type {
  KnowledgeCapsule,
} from "./types";

export interface KnowledgeCapsuleFilterState {
  stage: string;
  authority: string;
  approval: string;
  packageType: string;
  mission: string;
  conversation: string;
  compiler: string;
  owner: string;
  educationalModule: string;
  consumer: string;
  confidence: string;
  status: string;
}

interface KnowledgeCapsuleFiltersProps {
  capsules: KnowledgeCapsule[];
  filters: KnowledgeCapsuleFilterState;
  onFiltersChange: (
    filters: KnowledgeCapsuleFilterState,
  ) => void;
  resultCount?: number;
}

export const emptyKnowledgeCapsuleFilters: KnowledgeCapsuleFilterState = {
  stage: "",
  authority: "",
  approval: "",
  packageType: "",
  mission: "",
  conversation: "",
  compiler: "",
  owner: "",
  educationalModule: "",
  consumer: "",
  confidence: "",
  status: "",
};

type FilterKey =
  keyof KnowledgeCapsuleFilterState;

interface FilterDefinition {
  key: FilterKey;
  label: string;
  options: string[];
}

function unique(
  values: Array<string | undefined>,
) {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string =>
          Boolean(value),
      ),
    ),
  ).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function KnowledgeCapsuleFilters({
  capsules,
  filters,
  onFiltersChange,
  resultCount,
}: KnowledgeCapsuleFiltersProps) {
  const [
    advancedOpen,
    setAdvancedOpen,
  ] = useState(false);

  const advancedPanelId =
    useId();

  const definitions = useMemo<FilterDefinition[]>(
    () => [
      {
        key: "stage",
        label: "Stage",
        options: unique(
          capsules.map(
            (capsule) =>
              capsule.stage,
          ),
        ),
      },
      {
        key: "authority",
        label: "Authority",
        options: unique(
          capsules.map(
            (capsule) =>
              capsule.authority,
          ),
        ),
      },
      {
        key: "approval",
        label: "Approval",
        options: unique(
          capsules.map(
            (capsule) =>
              capsule.approval,
          ),
        ),
      },
      {
        key: "packageType",
        label: "Package Type",
        options: unique(
          capsules.map(
            (capsule) =>
              capsule.packageType,
          ),
        ),
      },
      {
        key: "mission",
        label: "Mission",
        options: unique(
          capsules
            .filter(
              (capsule) =>
                capsule.packageType === "Mission",
            )
            .map(
              (capsule) =>
                capsule.title,
            ),
        ),
      },
      {
        key: "conversation",
        label: "Conversation",
        options: unique(
          capsules
            .filter(
              (capsule) =>
                capsule.packageType === "Conversation",
            )
            .map(
              (capsule) =>
                capsule.title,
            ),
        ),
      },
      {
        key: "compiler",
        label: "Compiler",
        options: unique(
          capsules.map(
            (capsule) =>
              capsule.compiler,
          ),
        ),
      },
      {
        key: "owner",
        label: "Owner",
        options: unique(
          capsules.map(
            (capsule) =>
              capsule.owner,
          ),
        ),
      },
      {
        key: "educationalModule",
        label: "Educational Module",
        options: unique(
          capsules.map(
            (capsule) =>
              capsule.educationalModule,
          ),
        ),
      },
      {
        key: "consumer",
        label: "Consumer",
        options: unique(
          capsules.map(
            (capsule) =>
              capsule.consumer,
          ),
        ),
      },
      {
        key: "confidence",
        label: "Confidence",
        options: [
          "90–100%",
          "75–89%",
          "Below 75%",
        ],
      },
      {
        key: "status",
        label: "Status",
        options: unique(
          capsules.map(
            (capsule) =>
              capsule.state,
          ),
        ),
      },
    ],
    [capsules],
  );

  const primaryKeys: FilterKey[] = [
    "stage",
    "status",
    "approval",
    "packageType",
  ];

  const primaryDefinitions =
    definitions.filter(
      (definition) =>
        primaryKeys.includes(
          definition.key,
        ),
    );

  const advancedDefinitions =
    definitions.filter(
      (definition) =>
        !primaryKeys.includes(
          definition.key,
        ),
    );

  const activeEntries =
    definitions.filter(
      (definition) =>
        filters[definition.key],
    );

  function updateFilter(
    key: FilterKey,
    value: string,
  ) {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }

  function clearAll() {
    onFiltersChange(
      emptyKnowledgeCapsuleFilters,
    );
  }

  return (
    <ExecutiveFilterSurface
      ariaLabel="Executive knowledge capsule filters"
      summary={
        <div className="flex min-w-0 items-center gap-3">
          <div className={
            flagshipAppearance.capsuleFilterIcon
          }>
            <Filter
              aria-hidden="true"
              className="h-4 w-4 text-violet-200"
            />
          </div>

          <div className="min-w-0">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-300/68">
              Capsule traffic
            </div>

            <div
              aria-live="polite"
              className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1"
            >
              <span className="text-xs font-semibold text-amber-400">
                {resultCount ?? capsules.length} visible
              </span>

              <span className="text-[10px] text-sky-500/68">
                {activeEntries.length} active filters
              </span>
            </div>
          </div>
        </div>
      }
      primaryControls={
        <>
          {primaryDefinitions.map(
            (definition) => (
              <label
                key={definition.key}
                className="min-w-0"
              >
                <span className="sr-only">
                  {definition.label}
                </span>

                <select
                  value={
                    filters[
                      definition.key
                    ]
                  }
                  onChange={(event) =>
                    updateFilter(
                      definition.key,
                      event.target.value,
                    )
                  }
                  className={[
                    flagshipAppearance.capsuleFilterSelect,
                    "w-full",
                  ].join(" ")}
                >
                  <option value="">
                    All {definition.label}
                  </option>

                  {definition.options.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ),
          )}
        </>
      }
      actions={
        <>
          <button
            type="button"
            aria-expanded={
              advancedOpen
            }
            aria-controls={
              advancedPanelId
            }
            onClick={() =>
              setAdvancedOpen(
                (current) =>
                  !current,
              )
            }
            className={[
              flagshipAppearance.capsuleFilterAction,
              flagshipAppearance.capsuleFilterActionTone.advanced,
            ].join(" ")}
          >
            <SlidersHorizontal
              aria-hidden="true"
              className="h-3.5 w-3.5"
            />

            Advanced

            <ChevronDown
              aria-hidden="true"
              className={[
                "h-3.5 w-3.5 transition-transform",
                advancedOpen
                  ? "rotate-180"
                  : "",
              ].join(" ")}
            />
          </button>

          <button
            type="button"
            onClick={clearAll}
            disabled={
              activeEntries.length === 0
            }
            className={[
              flagshipAppearance.capsuleFilterAction,
              flagshipAppearance.capsuleFilterActionTone.clear,
            ].join(" ")}
          >
            <RotateCcw
              aria-hidden="true"
              className="h-3.5 w-3.5"
            />

            Clear
          </button>
        </>
      }
      activeFilters={
        activeEntries.length > 0 ? (
          <>
            {activeEntries.map(
              (definition) => (
                <button
                  key={
                    definition.key
                  }
                  type="button"
                  onClick={() =>
                    updateFilter(
                      definition.key,
                      "",
                    )
                  }
                  className={
                    flagshipAppearance.capsuleFilterPill
                  }
                >
                  <span>
                    {definition.label}:{" "}
                    {
                      filters[
                        definition.key
                      ]
                    }
                  </span>

                  <X
                    aria-hidden="true"
                    className="h-3 w-3 text-violet-300"
                  />
                </button>
              ),
            )}
          </>
        ) : undefined
      }
      advancedControls={
        advancedOpen ? (
          <>
            {advancedDefinitions.map(
              (definition) => (
                <label
                  key={definition.key}
                  className="grid gap-1.5"
                >
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-400/62">
                    {definition.label}
                  </span>

                  <select
                    value={
                      filters[
                        definition.key
                      ]
                    }
                    onChange={(event) =>
                      updateFilter(
                        definition.key,
                        event.target.value,
                      )
                    }
                    className={
                      flagshipAppearance.capsuleFilterSelect
                    }
                  >
                    <option value="">
                      All {definition.label}
                    </option>

                    {definition.options.map(
                      (option) => (
                        <option
                          key={option}
                          value={option}
                        >
                          {option}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              ),
            )}
          </>
        ) : undefined
      }
    />
  );
}
