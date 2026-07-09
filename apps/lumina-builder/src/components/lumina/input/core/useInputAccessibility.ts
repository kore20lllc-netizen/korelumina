import type {
  LuminaInputBaseProps,
} from "./types";

export function useInputAccessibility(
  props: LuminaInputBaseProps,
) {
  return {
    id: props.id,
    name: props.name,
    "aria-disabled": props.disabled,
    "aria-required": props.required,
    "aria-readonly": props.readOnly,
  };
}
