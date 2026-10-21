import {
  PlaceholderInspectorControl,
  SliderControl,
} from "../controls";

import type {
  LuminaInspectorControlRegistry,
} from "./types";

export const luminaInspectorControlRegistry: LuminaInspectorControlRegistry = {
  custom: PlaceholderInspectorControl,
  toggle: PlaceholderInspectorControl,
  slider: SliderControl,
  select: PlaceholderInspectorControl,
  radio: PlaceholderInspectorControl,
  color: PlaceholderInspectorControl,
  number: PlaceholderInspectorControl,
  text: PlaceholderInspectorControl,
};
