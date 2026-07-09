import type {
  LuminaInspectorControlModel,
} from "../model";

export function PlaceholderControl({
  control,
}: {
  control: LuminaInspectorControlModel;
}) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-sm text-muted-foreground">
      {control.type}: {control.label}
    </div>
  );
}
