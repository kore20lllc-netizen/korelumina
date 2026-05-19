import { useEffect, useRef, useState } from "react";

type Opts = {
  typeMs?: number;
  deleteMs?: number;
  holdMs?: number;
  betweenMs?: number;
  paused?: boolean;
};

/**
 * Animated typewriter string that types each phrase, holds, deletes, and
 * advances to the next — looping forever. Pauses when `paused` is true.
 */
export function useTypewriter(phrases: string[], opts: Opts = {}) {
  const {
    typeMs = 55,
    deleteMs = 30,
    holdMs = 1400,
    betweenMs = 400,
    paused = false,
  } = opts;

  const [text, setText] = useState("");
  const phraseIdx = useRef(0);
  const charIdx = useRef(0);
  const phaseRef = useRef<"typing" | "holding" | "deleting" | "between">("typing");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (paused || phrases.length === 0) {
      if (timer.current) clearTimeout(timer.current);
      return;
    }

    const tick = () => {
      const current = phrases[phraseIdx.current % phrases.length];
      const phase = phaseRef.current;

      if (phase === "typing") {
        if (charIdx.current < current.length) {
          charIdx.current += 1;
          setText(current.slice(0, charIdx.current));
          timer.current = setTimeout(tick, typeMs);
        } else {
          phaseRef.current = "holding";
          timer.current = setTimeout(tick, holdMs);
        }
      } else if (phase === "holding") {
        phaseRef.current = "deleting";
        timer.current = setTimeout(tick, deleteMs);
      } else if (phase === "deleting") {
        if (charIdx.current > 0) {
          charIdx.current -= 1;
          setText(current.slice(0, charIdx.current));
          timer.current = setTimeout(tick, deleteMs);
        } else {
          phaseRef.current = "between";
          timer.current = setTimeout(tick, betweenMs);
        }
      } else {
        phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
        phaseRef.current = "typing";
        timer.current = setTimeout(tick, typeMs);
      }
    };

    timer.current = setTimeout(tick, typeMs);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [paused, phrases, typeMs, deleteMs, holdMs, betweenMs]);

  return text;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}