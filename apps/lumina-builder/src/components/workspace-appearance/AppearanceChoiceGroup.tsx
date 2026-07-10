interface Option {
  label: string;
  value: string;
}

interface AppearanceChoiceGroupProps {
  title: string;
  value: string;
  options: Option[];
}

export function AppearanceChoiceGroup({
  title,
  value,
  options,
}: AppearanceChoiceGroupProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">
        {title}
      </h4>

      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-white/5"
          >
            <input
              type="radio"
              checked={option.value === value}
              readOnly
            />

            <span className="text-sm">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
