interface ExecutiveStatusHaloProps {
  className: string;
}

export function ExecutiveStatusHalo({
  className,
}: ExecutiveStatusHaloProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        "absolute",
        "inset-0",
        "rounded-xl",
        "opacity-70",
        className,
      ].join(" ")}
    />
  );
}
