import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { toneText } from "../../executive/shared/ExecutiveSection";
import type { RuntimeControl } from "../state/useRuntimeControl";

/* MS-2026-0011: the dev server's own output, as Runtime keeps it. */

function lineTone(line: string): string | undefined {
  if (/\b(error|failed|exception|ERR!)\b/i.test(line)) return toneText.error;
  if (/\bwarn(ing)?\b/i.test(line)) return toneText.warning;
  return undefined;
}

export function LogsPane({ runtime }: { runtime: RuntimeControl }) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [runtime.logs.length]);

  return (
    <div className="min-h-[320px] flex-1 overflow-auto bg-black/30 px-4 py-3 font-mono text-[11.5px] leading-5 text-sky-100/80">
      {runtime.logsError ? <p className={toneText.error}>{runtime.logsError}</p> : null}
      {!runtime.logsError && runtime.logs.length === 0 ? <p className="text-sky-300/50">No output yet. Logs appear once the server starts.</p> : null}
      {runtime.logs.map((line, index) => (
        <div key={index} className={cn("whitespace-pre-wrap break-words", lineTone(line))}>
          {line}
        </div>
      ))}
      <div ref={bottom} />
    </div>
  );
}
