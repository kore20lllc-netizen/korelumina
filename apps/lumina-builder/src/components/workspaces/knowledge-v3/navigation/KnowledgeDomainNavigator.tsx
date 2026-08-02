import {
  Factory,
  GraduationCap,
} from "lucide-react";

import {
  ExecutivePremiumIcon,
} from "@/components/design-system/executive/ExecutivePremiumIcon";

import {
  useKnowledgeV3Workspace,
} from "../state";

import type {
  KnowledgeV3DomainDefinition,
} from "../state";

const DOMAINS: KnowledgeV3DomainDefinition[] = [
  {
    id: "learning",
    label: "Learning",
    description:
      "Executive education, competency and activation readiness",
  },
  {
    id: "production",
    label: "Production",
    description:
      "Institutional knowledge acquisition and publication pipeline",
  },
];

const DOMAIN_ICONS = {
  learning: GraduationCap,
  production: Factory,
} as const;

export function KnowledgeDomainNavigator() {
  const {
    activeDomain,
    setActiveDomain,
  } = useKnowledgeV3Workspace();

  return (
    <nav
      aria-label="Knowledge Operations domains"
      className="
        relative grid gap-3 overflow-hidden rounded-[28px]
        border border-cyan-300/34 p-3
        bg-[radial-gradient(circle_at_18%_0%,rgba(37,99,235,0.12),transparent_34%),radial-gradient(circle_at_82%_100%,rgba(147,51,234,0.11),transparent_36%),linear-gradient(135deg,rgba(2,6,23,0.70),rgba(17,10,45,0.64),rgba(2,8,26,0.68))]
        ring-1 ring-inset ring-cyan-100/10
        shadow-[0_0_0_1px_rgba(59,130,246,0.10),0_18px_58px_rgba(2,6,23,0.34),inset_0_1px_0_rgba(255,255,255,0.06)]
        backdrop-blur-[36px] backdrop-saturate-[170%]
        sm:grid-cols-2
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-x-[8%] top-0 h-px
          bg-gradient-to-r
          from-transparent via-cyan-200/46 to-transparent
        "
      />

      {DOMAINS.map((domain) => {
        const Icon =
          DOMAIN_ICONS[domain.id];

        const selected =
          domain.id === activeDomain;

        return (
          <button
            key={domain.id}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              setActiveDomain(domain.id);
            }}
            className={[
              "group relative flex min-w-0 items-start gap-3 overflow-hidden rounded-[21px] border px-4 py-3.5 text-left",
              "transition-[transform,border-color,background-color,box-shadow] duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/46",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              "motion-reduce:transform-none motion-reduce:transition-none",
              selected
                ? [
                    "border-cyan-200/62",
                    "bg-[linear-gradient(135deg,rgba(8,27,62,0.84),rgba(31,17,67,0.72),rgba(6,24,55,0.80))]",
                    "shadow-[inset_0_1px_0_rgba(186,230,253,0.10),0_0_28px_rgba(34,211,238,0.14),0_16px_34px_rgba(2,6,23,0.24)]",
                  ].join(" ")
                : [
                    "border-cyan-300/20",
                    "bg-[linear-gradient(135deg,rgba(3,12,35,0.60),rgba(15,12,42,0.52),rgba(3,14,37,0.58))]",
                    "shadow-[inset_0_1px_0_rgba(186,230,253,0.04),0_10px_24px_rgba(2,6,23,0.16)]",
                    "hover:-translate-y-0.5 hover:border-cyan-200/44",
                    "hover:bg-[linear-gradient(135deg,rgba(5,18,49,0.74),rgba(24,16,58,0.62),rgba(5,20,48,0.70))]",
                    "hover:shadow-[inset_0_1px_0_rgba(186,230,253,0.07),0_14px_30px_rgba(2,6,23,0.22)]",
                  ].join(" "),
            ].join(" ")}
          >
            <div
              aria-hidden="true"
              className={[
                "pointer-events-none absolute inset-x-5 top-0 h-px",
                selected
                  ? "bg-gradient-to-r from-transparent via-cyan-100/68 to-transparent"
                  : "bg-gradient-to-r from-transparent via-cyan-200/16 to-transparent",
              ].join(" ")}
            />

            <span className="relative shrink-0">
              <ExecutivePremiumIcon
                icon={Icon}
                state={
                  selected
                    ? domain.id === "learning"
                      ? "active"
                      : "warning"
                    : "active"
                }
              />
            </span>

            <span className="relative min-w-0 flex-1">
              <span
                className={[
                  "block text-sm font-semibold tracking-[-0.01em]",
                  selected
                    ? "text-amber-400"
                    : "text-sky-300/78 group-hover:text-sky-200",
                ].join(" ")}
              >
                {domain.label}
              </span>

              <span
                className={[
                  "mt-1 block text-xs leading-5",
                  selected
                    ? "text-sky-400/82"
                    : "text-sky-500/66 group-hover:text-sky-400/76",
                ].join(" ")}
              >
                {domain.description}
              </span>
            </span>

            <span
              aria-hidden="true"
              className={[
                "relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full border",
                selected
                  ? domain.id === "learning"
                    ? "border-cyan-200/72 bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.72)]"
                    : "border-violet-200/72 bg-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.72)]"
                  : "border-sky-300/18 bg-slate-800/78",
              ].join(" ")}
            />
          </button>
        );
      })}
    </nav>
  );
}
