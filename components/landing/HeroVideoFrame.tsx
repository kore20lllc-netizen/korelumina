import { useEffect, useRef, useState } from "react";

export function HeroVideoFrame() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasVideo, setHasVideo] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onErr = () => setHasVideo(false);
    v.addEventListener("error", onErr);
    return () => v.removeEventListener("error", onErr);
  }, []);

  // Subtle parallax on scroll
  const wrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        const y = Math.max(-30, Math.min(30, window.scrollY * -0.04));
        el.style.transform = `translate3d(0, ${y}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* outer glow */}
      <div
        className="absolute -inset-6 rounded-[2rem] blur-3xl opacity-60 pointer-events-none"
        style={{ background: "var(--gradient-lumina)" }}
        aria-hidden
      />
      <div className="relative glass-strong rounded-[1.5rem] overflow-hidden shadow-[var(--shadow-float)] border border-white/10">
        {/* fake browser chrome */}
        <div className="flex items-center gap-2 px-4 h-9 border-b border-white/10 bg-surface-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-gold/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-cyan/80" />
          <div className="ml-3 flex-1 h-5 rounded-md bg-surface-2 border border-white/10 px-3 flex items-center text-[11px] text-muted-foreground tracking-tight">
            korelumina.app/studio
          </div>
        </div>

        <div className="relative aspect-[16/10] bg-surface-1">
          {hasVideo ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-contain"
            >
              <source src="/videos/hero-build-reel.webm" type="video/webm" />
              <source src="/videos/hero-build-reel.mp4" type="video/mp4" />
            </video>
          ) : null}

          {/* fallback / overlay gradient */}
          <div
            className="absolute inset-0 bg-aurora opacity-90"
            style={{ mixBlendMode: hasVideo ? "soft-light" : "normal" }}
            aria-hidden
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(135deg, hsl(220 20% 100% / 0.06), transparent 35%, transparent 65%, hsl(220 20% 100% / 0.04))" }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}