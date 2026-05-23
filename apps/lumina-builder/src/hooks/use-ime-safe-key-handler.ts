import { useRef, useCallback } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  CompositionEvent as ReactCompositionEvent,
  FocusEvent as ReactFocusEvent,
} from "react";

/**
 * Returns a set of input/textarea event handlers that wrap a key handler so
 * it never fires while an IME composition is in progress.
 *
 * Guards covered:
 * - Local composition tracker (start/update/end)
 * - `nativeEvent.isComposing` (spec-compliant browsers)
 * - `keyCode === 229` (Chrome/Edge IME placeholder)
 * - `key === "Process"` / `"Unidentified"` (Firefox/older browsers)
 * - Blur safety net so a missed `compositionend` can't permanently disable
 *   the handler on the next focus.
 *
 * Callers can compose the returned handlers with their own listeners by
 * spreading them onto the element first, then overriding as needed.
 */
export function useImeSafeKeyHandler<T extends HTMLElement = HTMLTextAreaElement>(
  onKey: (e: ReactKeyboardEvent<T>) => void,
) {
  const isComposingRef = useRef(false);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<T>) => {
      const ne = e.nativeEvent as KeyboardEvent;
      if (
        isComposingRef.current ||
        ne.isComposing ||
        ne.keyCode === 229 ||
        e.key === "Process" ||
        e.key === "Unidentified"
      ) {
        return;
      }
      onKey(e);
    },
    [onKey],
  );

  const onCompositionStart = useCallback((_e: ReactCompositionEvent<T>) => {
    isComposingRef.current = true;
  }, []);
  const onCompositionUpdate = useCallback((_e: ReactCompositionEvent<T>) => {
    isComposingRef.current = true;
  }, []);
  const onCompositionEnd = useCallback((_e: ReactCompositionEvent<T>) => {
    isComposingRef.current = false;
  }, []);
  const onBlur = useCallback((_e: ReactFocusEvent<T>) => {
    // If blur fires without a compositionend (browser quirks), clear the
    // flag so the next focus session isn't stuck in "composing" mode.
    isComposingRef.current = false;
  }, []);

  return { onKeyDown, onCompositionStart, onCompositionUpdate, onCompositionEnd, onBlur };
}