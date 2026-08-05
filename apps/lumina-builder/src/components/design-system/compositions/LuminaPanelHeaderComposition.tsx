import type {
  ReactNode,
} from "react";

type LuminaPanelHeaderCompositionProps = {
  iconRegion?: ReactNode;
  copyRegion: ReactNode;
  trailingRegion?: ReactNode;
  alignment?: "center" | "start";
  responsiveAction?: boolean;
  className?: string;
};

export function LuminaPanelHeaderComposition({
  iconRegion,
  copyRegion,
  trailingRegion,
  alignment = "center",
  responsiveAction = false,
  className,
}: LuminaPanelHeaderCompositionProps) {
  const alignmentClass =
    alignment === "start"
      ? "items-start"
      : "items-center";

  const trailingLayoutClass = trailingRegion
    ? responsiveAction
      ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      : `flex ${alignmentClass} justify-between gap-4`
    : `flex ${alignmentClass} gap-3`;

  return (
    <div
      className={[
        trailingLayoutClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "flex min-w-0 gap-3",
          alignmentClass,
        ].join(" ")}
      >
        {iconRegion}

        <div className="min-w-0">
          {copyRegion}
        </div>
      </div>

      {trailingRegion ? (
        <div className="shrink-0">
          {trailingRegion}
        </div>
      ) : null}
    </div>
  );
}
