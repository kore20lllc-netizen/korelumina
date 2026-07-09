import type { ReactNode } from "react";

import type {
  LuminaInspectorControlModel,
} from "../model";

export function renderInspectorControl(
  control: LuminaInspectorControlModel,
): ReactNode {
  switch (control.type) {
    case "custom":
      return control.control;

    case "toggle":
      return (
        <div>
          Toggle: {String(control.value)}
        </div>
      );

    case "slider":
      return (
        <div>
          Slider: {control.value}
        </div>
      );

    case "select":
      return (
        <div>
          Select: {control.value}
        </div>
      );

    case "radio":
      return (
        <div>
          Radio: {control.value}
        </div>
      );

    case "color":
      return (
        <div>
          Color: {control.value}
        </div>
      );

    case "number":
      return (
        <div>
          Number: {control.value}
        </div>
      );

    case "text":
      return (
        <div>
          Text: {control.value}
        </div>
      );

    default: {
      const exhaustive: never =
        control;

      return exhaustive;
    }
  }
}
