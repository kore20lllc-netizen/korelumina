interface AppearanceToggleProps {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?(checked: boolean): void;
}

export function AppearanceToggle({
  label,
  checked = false,
  disabled = false,
  onChange,
}: AppearanceToggleProps) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
      <span className="text-sm">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) =>
          onChange?.(
            event.currentTarget.checked,
          )
        }
      />
    </label>
  );
}
