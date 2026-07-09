import { PlaceholderControl } from "../controls/PlaceholderControl";

import type {
  LuminaInspectorControlRegistry,
} from "./types";

export const luminaInspectorControlRegistry: LuminaInspectorControlRegistry = {
  custom: PlaceholderControl,
  toggle: PlaceholderControl,
  slider: PlaceholderControl,
  select: PlaceholderControl,
  radio: PlaceholderControl,
  color: PlaceholderControl,
  number: PlaceholderControl,
  text: PlaceholderControl,
};
