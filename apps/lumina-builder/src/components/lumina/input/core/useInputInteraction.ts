export interface LuminaInputInteraction {
  disabled: boolean;
  readOnly: boolean;
}

export function useInputInteraction({
  disabled,
  readOnly,
}: LuminaInputInteraction) {
  return {
    interactive:
      !disabled && !readOnly,
  };
}
