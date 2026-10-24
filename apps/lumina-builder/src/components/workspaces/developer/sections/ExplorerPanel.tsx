import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileCode2, FolderClosed, FolderOpen, Search } from "lucide-react";

import { cn } from "@/lib/utils";

import { toneText } from "../../executive/shared/ExecutiveSection";
import type { FileNode } from "../shared/fileTree";
import { panelEyebrow, panelReflection, panelSurface } from "../shared/surfaces";
import type { DeveloperFiles } from "../state/useDeveloperFiles";

/* MS-2026-0011: the project's readable files, as Runtime lists them. */

function TreeRow({ node, depth, files }: { node: FileNode; depth: number; files: DeveloperFiles }) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === "folder") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          style={{ paddingLeft: 8 + depth * 12 }}
          className="flex h-7 w-full items-center gap-1.5 rounded-lg pr-2 text-left text-[13px] text-sky-200/70 transition hover:bg-white/[0.04] hover:text-sky-100"
          title={node.path}
        >
          {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          {open ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-300/80" /> : <FolderClosed className="h-3.5 w-3.5 shrink-0 text-amber-300/80" />}
          <span className="truncate">{node.name}</span>
        </button>
        {open ? node.children?.map((child) => <TreeRow key={child.path} node={child} depth={depth + 1} files={files} />) : null}
      </div>
    );
  }

  const active = files.active === node.path;
  const dirty = files.isDirty(node.path);
  return (
    <button
      type="button"
      onClick={() => files.open(node.path)}
      style={{ paddingLeft: 22 + depth * 12 }}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-lg pr-2 text-left text-[13px] transition",
        active ? "bg-cyan-400/10 text-cyan-100 ring-1 ring-inset ring-cyan-300/25" : "text-sky-200/70 hover:bg-white/[0.04] hover:text-sky-100",
      )}
      title={node.path}
    >
      <FileCode2 className={cn("h-3.5 w-3.5 shrink-0", active ? "text-cyan-300" : "text-sky-300/50")} />
      <span className="truncate">{node.name}</span>
      {dirty ? <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" aria-label="Unsaved" /> : null}
    </button>
  );
}

export function ExplorerPanel({ files }: { files: DeveloperFiles }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? files.files.filter((file) => file.toLowerCase().includes(needle)).slice(0, 200) : null;
  }, [files.files, query]);

  return (
    <aside aria-label="Explorer" className={cn(panelSurface, "max-h-[34vh] lg:max-h-none lg:flex-1")}>
      <div aria-hidden="true" className={panelReflection} />
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <span className={panelEyebrow}>Explorer</span>
        <span className="text-[10px] text-sky-300/50">{files.files.length} files</span>
      </div>
      <label className="mx-3 mt-3 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 focus-within:border-cyan-300/40">
        <Search className="h-3 w-3 text-sky-300/50" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a file"
          aria-label="Find a file"
          className="w-full bg-transparent text-xs text-sky-100 placeholder:text-sky-300/40 focus:outline-none"
        />
      </label>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
        {files.state.status === "idle" ? <p className="px-2 py-3 text-xs text-sky-300/60">Open a project from Projects to see its files.</p> : null}
        {files.state.status === "loading" ? <p className="px-2 py-3 text-xs text-sky-300/60">Reading files from Runtime…</p> : null}
        {files.state.status === "error" ? <p className={cn("px-2 py-3 text-xs", toneText.error)}>{files.state.message}</p> : null}
        {files.state.status === "ready" && files.files.length === 0 ? <p className="px-2 py-3 text-xs text-sky-300/60">No files KoreLumina can open here.</p> : null}
        {matches
          ? matches.map((file) => (
              <button
                key={file}
                type="button"
                onClick={() => files.open(file)}
                className={cn(
                  "flex w-full flex-col rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.04]",
                  files.active === file && "bg-cyan-400/10",
                )}
              >
                <span className="truncate text-[13px] text-sky-100">{file.split("/").pop()}</span>
                <span className="truncate text-[10px] text-sky-300/50">{file}</span>
              </button>
            ))
          : files.tree.map((node) => <TreeRow key={node.path} node={node} depth={0} files={files} />)}
        {matches && matches.length === 0 ? <p className="px-2 py-3 text-xs text-sky-300/60">No file matches “{query}”.</p> : null}
      </div>
    </aside>
  );
}
