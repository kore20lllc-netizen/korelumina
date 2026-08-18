import type { PropsWithChildren } from "react";

interface ExecutiveIconFrameProps extends PropsWithChildren {
  className?: string;
}

export function ExecutiveIconFrame({
  children,
  className = "",
}: ExecutiveIconFrameProps) {
  return (
    <div
      className={[
        "relative",
        "flex",
        "h-8",
        "w-8",
        "items-center",
        "justify-center",
        "rounded-xl",
        "border",
        "backdrop-blur-xl",
        "transition-all",
        "duration-300",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
