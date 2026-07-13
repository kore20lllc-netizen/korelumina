import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
} from "lucide-react";

interface Option {
  label: string;
  value: string;
}

interface AppearanceDropdownProps {
  title: string;
  value: string;
  options: Option[];
  onChange(value: string): void;
}

export function AppearanceDropdown({
  title,
  value,
  options,
  onChange,
}: AppearanceDropdownProps) {

  const [open, setOpen] =
    useState(false);

  const ref =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(
      event: MouseEvent,
    ) {
      if (
        ref.current &&
        !ref.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClick,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick,
      );
  }, []);

  const current =
    options.find(
      o => o.value === value,
    ) ?? options[0];

  return (
    <div
      ref={ref}
      className="relative space-y-2"
    >
      <label className="text-sm font-medium">
        {title}
      </label>

      <button
        type="button"
        onClick={() =>
          setOpen(v => !v)
        }
        className="
          grid
          w-full
          grid-cols-[1fr_auto]
          items-center
          gap-3
          rounded-2xl
          border
          border-white/15
          bg-[rgba(255,255,255,.03)]
          px-4
          py-3
          transition-all
          hover:border-white/25
          hover:bg-white/5
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          <Check
            className="
              h-4
              w-4
              text-amber-300
            "
          />

          <span
            className="truncate"
          >
            {current.label}
          </span>
        </div>

        <ChevronDown
          className={`
            h-4
            w-4
            shrink-0
            text-white/70
            transition-transform
            duration-200
            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        />
      </button>

      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            top-full
            z-50
            mt-2
            overflow-hidden
            rounded-2xl
            border
            border-white/20
            bg-[rgba(8,10,18,.82)]
            backdrop-blur-3xl
          "
          style={{
            boxShadow:
              "0 16px 48px rgba(0,0,0,.55),0 0 40px rgba(120,90,255,.18)",
          }}
        >
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(
                  option.value,
                );
                setOpen(false);
              }}
              className="
                flex
                w-full
                items-center
                gap-3
                px-4
                py-3
                text-left
                transition
                hover:bg-white/5
              "
            >
              <Check
                className={
                  option.value === value
                    ? "h-4 w-4 text-amber-300"
                    : "h-4 w-4 opacity-0"
                }
              />

              <span>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
