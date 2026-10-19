import luminaLogo from "@/assets/optimized/lumina.webp";

/*
 * EW-0: the Chief Agent speaks under the KoreLumina logo instead of a name.
 *
 * EW-1c: while it is thinking (reasoning toward a reply, or preparing the
 * briefing) the logo becomes the living Lumina form, the owner's chosen
 * motion from the landing page, re-encoded small for the conversation
 * (public/videos/chief-agent-thinking.*, about 100 KB each, from
 * landing-bg.mp4), held in a circle with a soft gold glow, no ring.
 * Reduced-motion users see a still frame instead.
 */
const THINKING_POSTER = "/videos/chief-agent-thinking-poster.webp";

export function ChiefAgentLogo({
  replying = false,
  className = "h-7 w-7",
}: {
  replying?: boolean;
  className?: string;
}) {
  if (replying) {
    return (
      <span
        role="img"
        aria-label="Chief Agent is thinking"
        title="Chief Agent is thinking"
        className={[
          "relative inline-grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full",
          "bg-slate-950",
          "shadow-[0_0_16px_rgba(217,164,65,.45),0_0_32px_rgba(185,122,24,.25)]",
        ].join(" ")}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          poster={THINKING_POSTER}
          className="h-[115%] w-[115%] max-w-none object-cover mix-blend-screen motion-reduce:hidden"
        >
          <source src="/videos/chief-agent-thinking.webm" type="video/webm" />
          <source src="/videos/chief-agent-thinking.mp4" type="video/mp4" />
        </video>
        <img
          src={THINKING_POSTER}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="hidden h-[115%] w-[115%] max-w-none object-cover mix-blend-screen motion-reduce:block"
        />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="Chief Agent"
      title="Chief Agent"
      className={[
        "relative inline-grid shrink-0 place-items-center rounded-full ring-1 ring-white/15 shadow-[0_0_12px_rgba(34,211,238,.12)]",
        className,
      ].join(" ")}
    >
      <img
        src={luminaLogo}
        alt=""
        draggable={false}
        className="h-full w-full rounded-full object-cover"
      />
    </span>
  );
}
