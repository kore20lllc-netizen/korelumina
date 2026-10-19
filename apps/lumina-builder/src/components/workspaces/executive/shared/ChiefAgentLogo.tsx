import luminaLogo from "@/assets/optimized/lumina.webp";

/*
 * EW-0: the Chief Agent speaks under the KoreLumina logo instead of a
 * name. While it is replying the logo turns a full 360 degrees, over and
 * over, until the reply lands. Reduced-motion users get a steady glow.
 */
export function ChiefAgentLogo({
  replying = false,
  className = "h-7 w-7",
}: {
  replying?: boolean;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={replying ? "Chief Agent is replying" : "Chief Agent"}
      title={replying ? "Chief Agent is replying" : "Chief Agent"}
      className={[
        "relative inline-grid shrink-0 place-items-center rounded-full ring-1 transition-shadow duration-300",
        replying
          ? "ring-amber-300/60 shadow-[0_0_0_1px_rgba(247,215,116,.18),0_0_18px_rgba(247,215,116,.35),0_0_32px_rgba(34,211,238,.18)]"
          : "ring-white/15 shadow-[0_0_12px_rgba(34,211,238,.12)]",
        className,
      ].join(" ")}
    >
      <img
        src={luminaLogo}
        alt=""
        draggable={false}
        className={[
          "h-full w-full rounded-full object-cover",
          replying ? "animate-[spin_1.6s_linear_infinite] motion-reduce:animate-none" : "",
        ].join(" ")}
      />
    </span>
  );
}
