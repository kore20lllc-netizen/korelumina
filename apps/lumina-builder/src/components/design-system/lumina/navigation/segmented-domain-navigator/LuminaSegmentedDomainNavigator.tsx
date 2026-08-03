import type {
  ComponentType,
  ReactNode,
} from "react";

export interface LuminaSegmentedDomainNavigatorItem<
  TId extends string,
> {
  id: TId;
  label: ReactNode;
  description: ReactNode;
  icon: ComponentType<{
    "aria-hidden"?: boolean | "true" | "false";
    className?: string;
  }>;
  tone: "amber" | "violet";
}

export interface LuminaSegmentedDomainNavigatorProps<
  TId extends string,
> {
  ariaLabel: string;
  groupAriaLabel: string;
  items: readonly LuminaSegmentedDomainNavigatorItem<TId>[];
  activeItemId: TId;
  onActiveItemChange(
    itemId: TId,
  ): void;
}

export function LuminaSegmentedDomainNavigator<
  TId extends string,
>({
  ariaLabel,
  groupAriaLabel,
  items,
  activeItemId,
  onActiveItemChange,
}: LuminaSegmentedDomainNavigatorProps<TId>) {
  return (
    <nav
      aria-label={ariaLabel}
      className={[
        "relative overflow-hidden rounded-[24px] border border-blue-400/56",
        "bg-[linear-gradient(135deg,rgba(3,10,30,.84),rgba(14,9,39,.78),rgba(3,12,34,.84))]",
        "p-1.5 ring-1 ring-inset ring-cyan-300/16",
        "shadow-[0_0_0_1px_rgba(59,130,246,.13),0_0_22px_rgba(37,99,235,.12),inset_0_1px_0_rgba(255,255,255,.05)]",
        "backdrop-blur-[34px]",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/48 to-transparent"
      />

      <div
        role="group"
        aria-label={groupAriaLabel}
        className="grid gap-1.5 sm:grid-cols-2"
      >
        {items.map((item) => {
          const Icon =
            item.icon;

          const selected =
            item.id === activeItemId;

          const amber =
            item.tone === "amber";

          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onActiveItemChange(item.id);
              }}
              className={[
                "group relative min-w-0 overflow-hidden rounded-[18px] border px-4 py-3.5 text-left",
                "transition-[transform,border-color,background-color,box-shadow] duration-200",
                "focus-visible:outline-none focus-visible:ring-2",
                amber
                  ? "focus-visible:ring-amber-300/60"
                  : "focus-visible:ring-violet-300/60",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                "motion-reduce:transform-none motion-reduce:transition-none",
                selected
                  ? amber
                    ? [
                        "border-amber-300/72",
                        "bg-[radial-gradient(circle_at_18%_0%,rgba(245,158,11,.18),transparent_38%),linear-gradient(135deg,rgba(52,27,8,.90),rgba(51,24,66,.82),rgba(42,24,8,.88))]",
                        "ring-1 ring-inset ring-amber-200/18",
                        "shadow-[0_0_0_1px_rgba(245,158,11,.16),0_0_28px_rgba(245,158,11,.15),inset_0_1px_0_rgba(254,243,199,.08)]",
                      ].join(" ")
                    : [
                        "border-violet-400/78",
                        "bg-[radial-gradient(circle_at_18%_0%,rgba(167,139,250,.26),transparent_40%),linear-gradient(135deg,rgba(45,20,84,.96),rgba(74,30,111,.90),rgba(38,18,78,.94))]",
                        "ring-1 ring-inset ring-violet-200/24",
                        "shadow-[0_0_0_1px_rgba(139,92,246,.24),0_0_34px_rgba(139,92,246,.24),inset_0_1px_0_rgba(237,233,254,.10)]",
                      ].join(" ")
                  : [
                      "border-slate-600/42",
                      "bg-[linear-gradient(135deg,rgba(5,12,30,.66),rgba(17,12,42,.58),rgba(5,14,33,.64))]",
                      "text-sky-400/76",
                      "hover:-translate-y-0.5 hover:border-blue-400/44",
                      "hover:bg-[linear-gradient(135deg,rgba(7,20,48,.76),rgba(24,16,57,.68),rgba(7,21,47,.74))]",
                    ].join(" "),
              ].join(" ")}
            >
              <div
                aria-hidden="true"
                className={[
                  "pointer-events-none absolute inset-x-5 top-0 h-px",
                  selected
                    ? amber
                      ? "bg-gradient-to-r from-transparent via-amber-200/76 to-transparent"
                      : "bg-gradient-to-r from-transparent via-violet-200/84 to-transparent"
                    : "bg-gradient-to-r from-transparent via-sky-200/12 to-transparent",
                ].join(" ")}
              />

              <div className="relative flex items-center gap-3">
                <span
                  className={[
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border",
                    "ring-1 ring-inset",
                    selected
                      ? amber
                        ? "border-amber-300/58 bg-amber-300/[0.10] text-amber-300 ring-amber-200/14 shadow-[0_0_18px_rgba(245,158,11,.18)]"
                        : "border-violet-400/70 bg-violet-300/[0.12] text-violet-200 ring-violet-200/18 shadow-[0_0_20px_rgba(139,92,246,.24)]"
                      : "border-slate-600/42 bg-slate-900/52 text-sky-500/58 ring-slate-500/10",
                  ].join(" ")}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-4.5 w-4.5"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span
                      className={[
                        "block text-sm font-semibold tracking-[-0.01em]",
                        selected
                          ? amber
                            ? "text-amber-300"
                            : "text-violet-100"
                          : "text-sky-300/72 group-hover:text-sky-200",
                      ].join(" ")}
                    >
                      {item.label}
                    </span>

                    <span
                      aria-hidden="true"
                      className={[
                        "h-2.5 w-2.5 shrink-0 rounded-full border",
                        selected
                          ? amber
                            ? "border-amber-200/80 bg-amber-300 shadow-[0_0_12px_rgba(245,158,11,.72)]"
                            : "border-violet-100/88 bg-violet-300 shadow-[0_0_14px_rgba(139,92,246,.82)]"
                          : "border-slate-500/34 bg-slate-800/78",
                      ].join(" ")}
                    />
                  </span>

                  <span
                    className={[
                      "mt-1 block text-xs leading-5",
                      selected
                        ? amber
                          ? "text-amber-100/68"
                          : "text-violet-100/74"
                        : "text-sky-500/60 group-hover:text-sky-400/74",
                    ].join(" ")}
                  >
                    {item.description}
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
