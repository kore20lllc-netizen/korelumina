interface Option {
  label: string;
  value: string;
}

interface Props {
  title: string;
  value: string;
  options: Option[];
}

export function AppearanceRadioGroup({
  title,
  value,
  options,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        {title}
      </div>

      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3"
          >
            <input
              checked={option.value === value}
              readOnly
              type="radio"
            />

            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
