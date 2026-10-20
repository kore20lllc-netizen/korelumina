/*
 * EW-1h: the Chief Agent's thinking form, ready before it is needed.
 *
 * The three dots appear the instant the owner sends; the form used to
 * appear only after a new <video> loaded and started decoding. One muted,
 * looping video is created when the Executive Office loads and shared by
 * every thinking avatar, so the form is already moving when a reply starts.
 * It plays only while an avatar is showing it.
 *
 * The source has a black background. Blending it away with
 * mix-blend-screen failed wherever an ancestor isolates blending (the
 * avatar's own glow filter did), leaving a dark square. Instead each frame
 * is keyed: brightness becomes opacity, so black is transparent on any
 * background and the glow follows the form itself.
 */

const SOURCES = [
  { src: "/videos/chief-agent-thinking.webm", type: "video/webm" },
  { src: "/videos/chief-agent-thinking.mp4", type: "video/mp4" },
];

export const THINKING_POSTER = "/videos/chief-agent-thinking-poster.webp";

/* Compression leaves the black slightly above zero; below this is background. */
const BLACK_FLOOR = 14;

let video: HTMLVideoElement | null = null;
let poster: HTMLImageElement | null = null;
let viewers = 0;

export function thinkingVideo(): HTMLVideoElement | null {
  if (typeof document === "undefined") return null;
  if (!video) {
    video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    const source = SOURCES.find((candidate) => video!.canPlayType(candidate.type)) ?? SOURCES[1];
    video.src = source.src;
    video.load();
  }
  return video;
}

export function thinkingPoster(): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  if (!poster) {
    poster = new Image();
    poster.decoding = "async";
    poster.src = THINKING_POSTER;
  }
  return poster;
}

/* Start loading both now, so the first reply does not wait for them. */
export function warmThinkingForm(): void {
  thinkingVideo();
  thinkingPoster();
}

/* Plays the shared video while at least one avatar shows it. */
export function watchThinkingVideo(): () => void {
  const shared = thinkingVideo();
  if (!shared) return () => {};
  viewers += 1;
  void shared.play().catch(() => {
    /* Autoplay refused: the keyed poster stays on screen. */
  });
  return () => {
    viewers -= 1;
    if (viewers === 0) shared.pause();
  };
}

/*
 * Draws a source frame centred and uncropped (object-contain), then makes
 * black transparent: opacity follows each pixel's brightest channel, and
 * the colour is restored to full strength so the form keeps its light.
 */
export function drawKeyedFrame(
  context: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): void {
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  if (!sourceWidth || !sourceHeight) return;

  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

  const frame = context.getImageData(0, 0, width, height);
  const pixels = frame.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const brightest = Math.max(pixels[index], pixels[index + 1], pixels[index + 2]);
    if (brightest <= BLACK_FLOOR) {
      pixels[index + 3] = 0;
      continue;
    }
    const lift = 255 / brightest;
    pixels[index] *= lift;
    pixels[index + 1] *= lift;
    pixels[index + 2] *= lift;
    pixels[index + 3] = ((brightest - BLACK_FLOOR) * 255) / (255 - BLACK_FLOOR);
  }
  context.putImageData(frame, 0, 0);
}
