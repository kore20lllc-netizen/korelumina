import { CSSProperties, useEffect, useState } from "react";

interface ExecutionCursorProps {
  target: HTMLElement | null;
  container: HTMLElement | null;
}

export function ExecutionCursor({
  target,
  container,
}: ExecutionCursorProps) {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    if (!target || !container) {
      setStyle(null);
      return;
    }

    const update = () => {
      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setStyle({
        position: "absolute",
        left: targetRect.left - containerRect.left,
        top: targetRect.top - containerRect.top,
        width: targetRect.width,
        height: targetRect.height,
      });
    };

    update();

    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
    };
  }, [target, container]);

  if (!style) {
    return null;
  }

  return (
    <div
      aria-hidden
      style={style}
      className="
        pointer-events-none
        z-0
        rounded-2xl
        border
        border-cyan-300
        bg-cyan-400/5
        shadow-[0_0_32px_rgba(34,211,238,.35)]
        transition-all
        duration-300
      "
    />
  );
}
