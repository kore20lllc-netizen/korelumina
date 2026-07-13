import type {
  LuminaInputBaseProps,
} from "./types";

export function useInputState(
  props: LuminaInputBaseProps,
) {
  return {
    disabled: props.disabled ?? false,
    readOnly: props.readOnly ?? false,
    required: props.required ?? false,
  };
}
