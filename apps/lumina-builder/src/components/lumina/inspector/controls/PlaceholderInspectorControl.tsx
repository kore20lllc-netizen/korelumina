import type {
  LuminaInspectorControlModel,
} from "../model";

import {
  PlaceholderControl,
} from "./PlaceholderControl";

/*
 * MS-2026-0006: the registry gives each control its model, but
 * PlaceholderControl takes children, so placeholders rendered empty. This
 * names the control that is not built yet.
 */
export function PlaceholderInspectorControl({
  control,
}: {
  control: LuminaInspectorControlModel;
}) {
  return (
    <PlaceholderControl>
      {control.label} · {control.type} control not built yet
    </PlaceholderControl>
  );
}
