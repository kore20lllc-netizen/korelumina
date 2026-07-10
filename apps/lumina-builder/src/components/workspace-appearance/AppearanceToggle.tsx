interface AppearanceToggleProps {
  label: string;
  checked?: boolean;
}

export function AppearanceToggle({
  label,
  checked = false,
}: AppearanceToggleProps) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
      <span className="text-sm">
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        readOnly
      />
    </label>
  );
}
