import { cn } from "@/lib/utils";

export interface LuminaInspectorDividerProps {
  className?: string;
}

export function LuminaInspectorDivider({
  className,
}: LuminaInspectorDividerProps) {
  return (
    <div
      className={cn(
        "mx-5 border-t",
        "[border-color:var(--lumina-border-standard)]",
        className,
      )}
    />
  );
}

export default LuminaInspectorDivider;
