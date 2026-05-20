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
      <div
        aria-hidden
        className="absolute -inset-6 blur-3xl opacity-70 pointer-events-none"
        style={{ background: "var(--gradient-lumina)" }}
      />
      <div className="relative aspect-[16/10]">
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover rounded-[1.5rem]"
          >
            <source src="/videos/hero-build-reel.webm" type="video/webm" />
            <source src="/videos/hero-build-reel.mp4" type="video/mp4" />
          </video>
        ) : (
          <div className="absolute inset-0 bg-aurora opacity-80 rounded-[1.5rem]" aria-hidden />
        )}
      </div>
    </div>
  );
}