import { createElement } from "react";

import {
  luminaInspectorControlRegistry,
} from "../registry";

import type {
  LuminaInspectorControlModel,
} from "../model";

export function renderInspectorControl(
  control: LuminaInspectorControlModel,
) {
  const ControlComponent =
    luminaInspectorControlRegistry[control.type];

  return createElement(
    ControlComponent,
    {
      control,
    },
  );
}
