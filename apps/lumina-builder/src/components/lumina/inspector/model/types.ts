import type { ReactNode } from "react";

export type LuminaInspectorControlType =
  | "custom"
  | "toggle"
  | "slider"
  | "select"
  | "radio"
  | "color"
  | "number"
  | "text";

export interface LuminaInspectorControlOption {
  value: string;
  label: string;
  description?: string;
}

interface LuminaInspectorControlBase {
  id: string;
  type: LuminaInspectorControlType;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface LuminaInspectorCustomControlModel
  extends LuminaInspectorControlBase {
  type: "custom";
  control: ReactNode;
}

export interface LuminaInspectorToggleControlModel
  extends LuminaInspectorControlBase {
  type: "toggle";
  value: boolean;
}

export interface LuminaInspectorSliderControlModel
  extends LuminaInspectorControlBase {
  type: "slider";
  value: number;
  min: number;
  max: number;
  step?: number;
}

export interface LuminaInspectorSelectControlModel
  extends LuminaInspectorControlBase {
  type: "select";
  value: string;
  options: LuminaInspectorControlOption[];
}

export interface LuminaInspectorRadioControlModel
  extends LuminaInspectorControlBase {
  type: "radio";
  value: string;
  options: LuminaInspectorControlOption[];
}

export interface LuminaInspectorColorControlModel
  extends LuminaInspectorControlBase {
  type: "color";
  value: string;
}

export interface LuminaInspectorNumberControlModel
  extends LuminaInspectorControlBase {
  type: "number";
  value: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface LuminaInspectorTextControlModel
  extends LuminaInspectorControlBase {
  type: "text";
  value: string;
  placeholder?: string;
}

export type LuminaInspectorControlModel =
  | LuminaInspectorCustomControlModel
  | LuminaInspectorToggleControlModel
  | LuminaInspectorSliderControlModel
  | LuminaInspectorSelectControlModel
  | LuminaInspectorRadioControlModel
  | LuminaInspectorColorControlModel
  | LuminaInspectorNumberControlModel
  | LuminaInspectorTextControlModel;

export interface LuminaInspectorSectionModel {
  id: string;
  title: string;
  controls: LuminaInspectorControlModel[];
}

export interface LuminaInspectorGroupModel {
  id: string;
  title: string;
  sections: LuminaInspectorSectionModel[];
}

export interface LuminaInspectorModel {
  title: string;
  description?: string;
  groups: LuminaInspectorGroupModel[];
}
