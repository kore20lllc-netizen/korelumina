import Editor, { type OnMount } from "@monaco-editor/react";
import { RefreshCw, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { toneText } from "../../executive/shared/ExecutiveSection";
import { detectLanguage } from "../shared/fileTree";
import { panelReflection, panelSurface, quietButton } from "../shared/surfaces";
import type { DeveloperFiles } from "../state/useDeveloperFiles";

/*
 * MS-2026-0011: the editor. The status bar reports what the editor itself
 * knows: syntax problems Monaco finds (it does not see the project's
 * types or dependencies, so it does not claim "no errors"), the language,
 * the line count, the selection AI Assist will focus on, and whether the
 * file is saved.
 */

const THEME = "korelumina-ko";

const beforeMount: Parameters<typeof Editor>[0]["beforeMount"] = (monaco) => {
  monaco.editor.defineTheme(THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "64748B", fontStyle: "italic" },
      { token: "keyword", foreground: "C4B5FD" },
      { token: "string", foreground: "FCD34D" },
      { token: "number", foreground: "6EE7B7" },
      { token: "type.identifier", foreground: "67E8F9" },
    ],
    colors: {
      "editor.background": "#00000000",
      "editor.foreground": "#E0F2FE",
      "editorLineNumber.foreground": "#334155",
      "editorLineNumber.activeForeground": "#7DD3FC",
      "editorCursor.foreground": "#22D3EE",
      "editor.selectionBackground": "#2563EB55",
      "editor.inactiveSelectionBackground": "#33415566",
      "editor.lineHighlightBackground": "#0EA5E90D",
      "editorGutter.background": "#00000000",
    },
  });
  const quiet = { noSemanticValidation: true, noSyntaxValidation: false };
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(quiet);
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(quiet);
};

export function EditorPanel({ files }: { files: DeveloperFiles }) {
  const active = files.active;
  const code = files.activeCode;
  const language = detectLanguage(active);

  const onMount: OnMount = (editor) => {
    editor.onDidChangeCursorSelection((event) => {
      const range = event.selection;
      if (range.isEmpty()) {
        files.setSelection(null);
        return;
      }
      const endLine = range.endColumn === 1 && range.endLineNumber > range.startLineNumber ? range.endLineNumber - 1 : range.endLineNumber;
      files.setSelection({ startLine: range.startLineNumber, endLine });
    });
  };

  return (
    <div className={cn(panelSurface, "min-h-[420px] flex-1")}>
      <div aria-hidden="true" className={panelReflection} />
      <div role="tablist" aria-label="Open files" className="flex min-h-[46px] items-end gap-1 overflow-x-auto border-b border-white/10 px-3 pt-2">
        {files.openTabs.length === 0 ? <span className="px-2 pb-3 text-xs text-sky-300/50">No file open</span> : null}
        {files.openTabs.map((tab) => {
          const isActive = tab === active;
          const dirty = files.isDirty(tab);
          return (
            <div
              key={tab}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "group relative flex h-9 max-w-[220px] shrink-0 items-center gap-2 rounded-t-xl pl-3 pr-1.5 text-xs transition",
                isActive ? "bg-white/[0.06] text-sky-50" : "text-sky-300/60 hover:bg-white/[0.03] hover:text-sky-100",
              )}
              title={tab}
            >
              <button type="button" onClick={() => files.open(tab)} className="flex min-w-0 items-center gap-2">
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dirty ? "bg-amber-300" : isActive ? "bg-cyan-300" : "bg-sky-300/30")} />
                <span className="truncate">{tab.split("/").pop()}</span>
              </button>
              <button
                type="button"
                onClick={() => files.close(tab)}
                aria-label={`Close ${tab}`}
                className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-sky-300/50 hover:bg-white/10 hover:text-sky-100"
              >
                <X className="h-3 w-3" />
              </button>
              {isActive ? <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-amber-300/70 via-cyan-300 to-violet-400/70" /> : null}
            </div>
          );
        })}
      </div>

      <div className="relative min-h-0 flex-1 font-mono text-[13px]">
        {!active ? (
          <div className="grid h-full place-items-center text-sm text-sky-300/60">Choose a file in the explorer.</div>
        ) : files.activeReadError ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div>
              <p className={cn("text-sm", toneText.error)}>{files.activeReadError}</p>
              <button type="button" onClick={() => void files.reload(active)} className={cn(quietButton, "mt-3")}>
                <RefreshCw className="h-3 w-3" /> Try again
              </button>
            </div>
          </div>
        ) : code === undefined ? (
          <div className="grid h-full place-items-center text-xs text-sky-300/60">Reading {active}…</div>
        ) : (
          <Editor
            key={active}
            height="100%"
            path={active}
            language={language}
            theme={THEME}
            value={code}
            beforeMount={beforeMount}
            onMount={onMount}
            onChange={(value) => files.edit(value ?? "")}
            onValidate={(markers) =>
              files.setProblems({
                errors: markers.filter((marker) => marker.severity >= 8).length,
                warnings: markers.filter((marker) => marker.severity === 4).length,
              })
            }
            loading={<div className="grid h-full place-items-center text-xs text-sky-300/60">Loading editor…</div>}
            options={{
              fontSize: 13,
              fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              minimap: { enabled: false },
              wordWrap: "on",
              automaticLayout: true,
              tabSize: 2,
              scrollBeyondLastLine: false,
              renderLineHighlight: "all",
              smoothScrolling: true,
              padding: { top: 14, bottom: 14 },
              overviewRulerBorder: false,
              fixedOverflowWidgets: true,
            }}
          />
        )}
      </div>

      <div className="flex min-h-[34px] flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/10 bg-black/20 px-4 py-1.5 text-[11px] text-sky-300/60">
        <div className="flex min-w-0 items-center gap-3">
          <span>{language}</span>
          {code !== undefined ? <span>{code.split("\n").length} lines</span> : null}
          {files.selection ? (
            <span className="text-cyan-200">
              Selected L{files.selection.startLine}
              {files.selection.endLine !== files.selection.startLine ? `–L${files.selection.endLine}` : ""}
            </span>
          ) : null}
          {files.loadingFile ? <span>reading…</span> : null}
        </div>
        <div className="flex min-w-0 items-center gap-3">
          {active && code !== undefined ? (
            <span className={files.problems.errors > 0 ? toneText.error : files.problems.warnings > 0 ? toneText.warning : undefined}>
              {files.problems.errors + files.problems.warnings === 0
                ? "No syntax problems"
                : `${files.problems.errors} syntax error${files.problems.errors === 1 ? "" : "s"} · ${files.problems.warnings} warning${files.problems.warnings === 1 ? "" : "s"}`}
            </span>
          ) : null}
          {active ? <span className={files.isDirty(active) ? toneText.warning : toneText.healthy}>{files.isDirty(active) ? "Unsaved" : "Saved"}</span> : null}
        </div>
      </div>
    </div>
  );
}
