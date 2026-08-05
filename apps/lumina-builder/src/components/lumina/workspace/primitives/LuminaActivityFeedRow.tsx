import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type LuminaActivityFeedRowVariant =
  | "feed"
  | "stream"
  | "log"
  | "progress";

export interface LuminaActivityFeedRowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  markerRegion?: ReactNode;
  primaryRegion: ReactNode;
  descriptionRegion?: ReactNode;
  metadataRegion?: ReactNode;
  timestampRegion?: ReactNode;
  trailingRegion?: ReactNode;
  variant?: LuminaActivityFeedRowVariant;
}

const variantClass: Record<
  LuminaActivityFeedRowVariant,
  string
> = {
  feed: "flex items-start gap-3",
  stream: "flex items-start gap-4",
  log: "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3",
  progress: "flex items-start gap-4",
};

export function LuminaActivityFeedRow({
  markerRegion,
  primaryRegion,
  descriptionRegion,
  metadataRegion,
  timestampRegion,
  trailingRegion,
  variant = "feed",
  className,
  ...props
}: LuminaActivityFeedRowProps) {
  return (
    <div
      className={cn(
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {markerRegion ? (
        <div className="shrink-0">
          {markerRegion}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        {primaryRegion}

        {descriptionRegion ? (
          <div className="mt-1">
            {descriptionRegion}
          </div>
        ) : null}

        {metadataRegion ? (
          <div className="mt-2">
            {metadataRegion}
          </div>
        ) : null}
      </div>

      {timestampRegion ? (
        <div className="shrink-0">
          {timestampRegion}
        </div>
      ) : null}

      {trailingRegion ? (
        <div className="shrink-0">
          {trailingRegion}
        </div>
      ) : null}
    </div>
  );
}

export default LuminaActivityFeedRow;
