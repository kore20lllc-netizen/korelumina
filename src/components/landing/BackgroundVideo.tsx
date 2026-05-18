import { useEffect, useRef } from "react";

interface BackgroundVideoProps {
  src: string;
  className?: string;
}

/**
 * Cross-browser background video.
 * - muted + playsInline + autoplay + loop are required for Safari/iOS/Chrome autoplay.
 * - Retries play() on failure (Safari sometimes rejects the initial play promise).
 * - Resumes when tab becomes visible or on first user interaction (autoplay-blocked fallback).
 * - Recovers from stalls/errors by reloading the source.
 */
export function BackgroundVideo({ src, className }: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Defensive: enforce autoplay-friendly properties (some browsers ignore attrs after hydration).
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute("webkit-playsinline", "true");

    let cancelled = false;
    let retryTimer: number | undefined;
    let autoplayBlocked = false;

    const tryPlay = (attempt = 0) => {
      if (cancelled || !video) return;
      const p = video.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          autoplayBlocked = false;
        }).catch((err: unknown) => {
          if (cancelled) return;
          const name = (err as { name?: string })?.name;
          // NotAllowedError = browser blocked autoplay (iOS Safari, locked-tab Chrome).
          // Wait for a user gesture instead of hammering play().
          if (name === "NotAllowedError") {
            autoplayBlocked = true;
            armGestureFallback();
            return;
          }
          if (attempt < 4) {
            retryTimer = window.setTimeout(() => tryPlay(attempt + 1), 400 * (attempt + 1));
          }
        });
      }
    };

    const onLoaded = () => tryPlay();
    const onVisibility = () => {
      if (document.visibilityState === "visible" && video.paused) tryPlay();
    };

    // iOS Safari requires play() to be called synchronously inside a user-gesture
    // event handler. We also force-reload the source on the gesture in case the
    // initial fetch was deferred or stalled while the tab was backgrounded.
    const gestureEvents = ["pointerdown", "touchstart", "touchend", "click", "keydown"] as const;
    const onUserGesture = () => {
      if (!video) return;
      try {
        video.muted = true;
        video.playsInline = true;
        if (video.readyState < 2) {
          try { video.load(); } catch {}
        }
        // Synchronous play call — required for iOS to grant the autoplay token.
        const p = video.play();
        if (p && typeof p.then === "function") {
          p.then(() => { autoplayBlocked = false; }).catch(() => {
            // Still blocked — leave listeners armed so the next gesture retries.
            if (!cancelled) armGestureFallback();
          });
        }
      } catch {
        /* noop */
      }
      disarmGestureFallback();
    };

    let gestureArmed = false;
    const armGestureFallback = () => {
      if (gestureArmed || cancelled) return;
      gestureArmed = true;
      for (const ev of gestureEvents) {
        window.addEventListener(ev, onUserGesture, { passive: true, capture: true });
      }
    };
    const disarmGestureFallback = () => {
      if (!gestureArmed) return;
      gestureArmed = false;
      for (const ev of gestureEvents) {
        window.removeEventListener(ev, onUserGesture, { capture: true } as EventListenerOptions);
      }
    };

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("canplay", onLoaded);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("canplaythrough", onLoaded);
    document.addEventListener("visibilitychange", onVisibility);

    // iOS Safari frequently rejects the very first play() with NotAllowedError
    // before the element has been laid out / become visible. Retry whenever the
    // element enters the viewport, when the page is restored from bfcache, or
    // when its layout box changes (e.g. font-driven reflow finishes).
    const retryIfBlocked = () => {
      if (cancelled || !video) return;
      if (autoplayBlocked || video.paused) tryPlay();
    };

    let io: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) retryIfBlocked();
        },
        { threshold: 0.01 },
      );
      io.observe(video);
    }

    let ro: ResizeObserver | undefined;
    let roFired = false;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        // First layout pass — element now has real box dimensions; safe to retry.
        if (!roFired) { roFired = true; return; }
        retryIfBlocked();
      });
      ro.observe(video);
    }

    const onPageShow = () => retryIfBlocked();
    window.addEventListener("pageshow", onPageShow);

    // One post-paint retry: after the first frame is committed the element is
    // guaranteed to be laid out, which is often enough on its own for iOS.
    let rafId = 0;
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(retryIfBlocked);
    });

    // Pre-arm the gesture fallback for iOS — Safari often rejects autoplay
    // silently, and we want the very first tap anywhere to start playback.
    armGestureFallback();

    // Kick off immediately; if metadata isn't ready yet, the loaded* handlers will retry.
    if (video.readyState >= 2) {
      tryPlay();
    } else {
      try { video.load(); } catch {}
      tryPlay();
    }

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (rafId) cancelAnimationFrame(rafId);
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("canplay", onLoaded);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("canplaythrough", onLoaded);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      io?.disconnect();
      ro?.disconnect();
      disarmGestureFallback();
      void autoplayBlocked;
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      controls={false}
      tabIndex={-1}
      aria-hidden
      className={className}
    />
  );
}