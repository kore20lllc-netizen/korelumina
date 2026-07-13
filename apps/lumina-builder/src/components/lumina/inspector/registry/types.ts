import type { ComponentType } from "react";

import type {
  LuminaInspectorControlModel,
  LuminaInspectorControlType,
} from "../model";

export type LuminaInspectorControlComponent =
  ComponentType<{
    control: LuminaInspectorControlModel;
  }>;

export type LuminaInspectorControlRegistry =
  Record<
    LuminaInspectorControlType,
    LuminaInspectorControlComponent
  >;
