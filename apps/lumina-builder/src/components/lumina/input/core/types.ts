export interface LuminaInputBaseProps {
  id?: string;
  name?: string;

  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;

  className?: string;
}

export interface LuminaValueInputProps<T>
  extends LuminaInputBaseProps {
  value: T;

  onValueChange(
    value: T,
  ): void;
}

export interface LuminaBooleanInputProps
  extends LuminaInputBaseProps {
  checked: boolean;

  onCheckedChange(
    checked: boolean,
  ): void;
}
