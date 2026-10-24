import luminaLogo from "@/assets/optimized/lumina.webp";

import { useEffect, useRef } from "react";

import {
  drawKeyedFrame,
  thinkingPoster,
  thinkingVideo,
  warmThinkingForm,
  watchThinkingVideo,
} from "./thinkingForm";

/*
 * EW-0: the Chief Agent speaks under the KoreLumina logo instead of a name.
 *
 * EW-1c: while it is thinking (reasoning toward a reply, or preparing the
 * briefing) the logo becomes the living Lumina form, the owner's chosen
 * motion from the landing page, re-encoded small for the conversation
 * (public/videos/chief-agent-thinking.*, about 100 KB each, from
 * landing-bg.mp4). The whole form shows, uncropped. (A circle and a gold
 * ring were tried and removed: the circle cut off the form.)
 *
 * EW-1h: the form has no background of its own (black is keyed to
 * transparent, see thinkingForm.ts) and appears as soon as a reply starts,
 * like the three dots: its video is loaded when the Executive Office opens.
 * Reduced-motion users see the keyed still frame.
 */
warmThinkingForm();

const FORM_PIXELS = 112;

export function ThinkingForm() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvas.current?.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const video = reducedMotion ? null : thinkingVideo();
    const poster = thinkingPoster();
    const stopWatching = video ? watchThinkingVideo() : () => {};
    let frame = 0;
    let drawnTime = -1;
    let posterDrawn = false;

    const render = () => {
      if (video && video.readyState >= 2) {
        if (video.currentTime !== drawnTime) {
          drawnTime = video.currentTime;
          drawKeyedFrame(context, video, video.videoWidth, video.videoHeight);
        }
      } else if (!posterDrawn && poster?.complete && poster.naturalWidth) {
        drawKeyedFrame(context, poster, poster.naturalWidth, poster.naturalHeight);
        posterDrawn = true;
      }
      if (video || !posterDrawn) frame = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      stopWatching();
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      width={FORM_PIXELS}
      height={FORM_PIXELS}
      aria-hidden="true"
      className="h-full w-full"
    />
  );
}

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
        className="relative inline-block h-14 w-14 shrink-0 drop-shadow-[0_0_14px_rgba(124,58,237,.35)]"
      >
        <ThinkingForm />
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
