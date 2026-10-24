import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { listRuntimeFiles, readRuntimeFile, writeRuntimeFile } from "@/services/runtimeService";

import { buildFileTree, describeRuntimeError, isReadableFile, preferredEntryFile } from "../shared/fileTree";

/*
 * MS-2026-0011: the project's files as Runtime holds them. A file is read
 * when first opened and saved with the hash it was read at, so a save
 * never overwrites a change made elsewhere (Runtime answers file_changed).
 */

export interface EditorSelectionRange {
  startLine: number;
  endLine: number;
}

export type FilesState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

export function useDeveloperFiles(projectId: string | null) {
  const [files, setFiles] = useState<string[]>([]);
  const [state, setState] = useState<FilesState>({ status: "idle" });
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [active, setActive] = useState("");
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [readErrors, setReadErrors] = useState<Record<string, string>>({});
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selection, setSelection] = useState<EditorSelectionRange | null>(null);
  const [problems, setProblems] = useState<{ errors: number; warnings: number }>({ errors: 0, warnings: 0 });
  const projectRef = useRef(projectId);
  projectRef.current = projectId;

  const tree = useMemo(() => buildFileTree(files), [files]);

  const loadList = useCallback(async (keepActive: boolean) => {
    const id = projectRef.current;
    if (!id) return;
    const listed = (await listRuntimeFiles(id)).filter(isReadableFile);
    if (projectRef.current !== id) return;
    setFiles(listed);
    if (!keepActive) {
      const entry = preferredEntryFile(listed);
      setActive(entry);
      setOpenTabs(entry ? [entry] : []);
    }
  }, []);

  useEffect(() => {
    setFiles([]);
    setOpenTabs([]);
    setActive("");
    setBuffers({});
    setSaved({});
    setHashes({});
    setReadErrors({});
    setSelection(null);
    setSaveError(null);
    if (!projectId) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "loading" });
    loadList(false)
      .then(() => setState({ status: "ready" }))
      .catch((error: unknown) =>
        setState({ status: "error", message: describeRuntimeError(error instanceof Error ? error.message : "failed_to_list_files") }),
      );
  }, [projectId, loadList]);

  const readInto = useCallback(async (file: string) => {
    const id = projectRef.current;
    if (!id) return;
    const result = await readRuntimeFile(id, file);
    if (projectRef.current !== id) return;
    const content = result.content ?? "";
    setBuffers((current) => ({ ...current, [file]: content }));
    setSaved((current) => ({ ...current, [file]: content }));
    setHashes((current) => ({ ...current, [file]: result.sha256 ?? "" }));
    setReadErrors((current) => {
      const next = { ...current };
      delete next[file];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!projectId || !active || buffers[active] !== undefined || readErrors[active]) return;
    let cancelled = false;
    setLoadingFile(true);
    readInto(active)
      .catch((error: unknown) => {
        if (cancelled) return;
        setReadErrors((current) => ({
          ...current,
          [active]: describeRuntimeError(error instanceof Error ? error.message : "failed_to_read_file"),
        }));
      })
      .finally(() => {
        if (!cancelled) setLoadingFile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, active, buffers, readErrors, readInto]);

  const isDirty = useCallback(
    (file: string) => buffers[file] !== undefined && buffers[file] !== saved[file],
    [buffers, saved],
  );
  const dirtyFiles = useMemo(() => Object.keys(buffers).filter((file) => buffers[file] !== saved[file]), [buffers, saved]);

  const open = useCallback((file: string) => {
    setActive(file);
    setSelection(null);
    setSaveError(null);
    setOpenTabs((tabs) => (tabs.includes(file) ? tabs : [...tabs, file]));
  }, []);

  const close = useCallback(
    (file: string) => {
      setOpenTabs((tabs) => {
        const next = tabs.filter((tab) => tab !== file);
        if (active === file) {
          const index = tabs.indexOf(file);
          setActive(next[index] ?? next[index - 1] ?? next[0] ?? "");
          setSelection(null);
        }
        return next;
      });
    },
    [active],
  );

  const edit = useCallback(
    (content: string) => {
      if (!active) return;
      setBuffers((current) => ({ ...current, [active]: content }));
    },
    [active],
  );

  const save = useCallback(async () => {
    const id = projectRef.current;
    if (!id || !active || buffers[active] === undefined) return;
    setSaving(true);
    setSaveError(null);
    try {
      const content = buffers[active];
      const result = await writeRuntimeFile({ projectId: id, file: active, content, expectedSha256: hashes[active] || undefined });
      setSaved((current) => ({ ...current, [active]: content }));
      if (result.sha256) setHashes((current) => ({ ...current, [active]: result.sha256 as string }));
    } catch (error) {
      setSaveError(describeRuntimeError(error instanceof Error ? error.message : "failed_to_write_file"));
    } finally {
      setSaving(false);
    }
  }, [active, buffers, hashes]);

  const revert = useCallback(() => {
    if (!active) return;
    setBuffers((current) => ({ ...current, [active]: saved[active] ?? "" }));
    setSaveError(null);
  }, [active, saved]);

  /* Reopens a file from disk, dropping unsaved edits to it. */
  const reload = useCallback(
    async (file: string) => {
      setSaveError(null);
      await readInto(file);
    },
    [readInto],
  );

  /* After AI changes are applied or undone: refresh the list and every touched file that is loaded. */
  const refreshAfterChange = useCallback(
    async (changed: string[]) => {
      await loadList(true).catch(() => undefined);
      const loaded = changed.filter((file) => buffers[file] !== undefined);
      await Promise.all(
        loaded.map((file) =>
          readInto(file).catch(() => {
            setBuffers((current) => {
              const next = { ...current };
              delete next[file];
              return next;
            });
            setOpenTabs((tabs) => tabs.filter((tab) => tab !== file));
            setActive((current) => (current === file ? "" : current));
          }),
        ),
      );
    },
    [buffers, loadList, readInto],
  );

  return {
    projectId,
    files,
    tree,
    state,
    openTabs,
    active,
    open,
    close,
    activeCode: active ? buffers[active] : undefined,
    activeReadError: active ? readErrors[active] ?? null : null,
    isDirty,
    dirtyFiles,
    edit,
    save,
    saving,
    saveError,
    revert,
    reload,
    loadingFile,
    selection,
    setSelection,
    problems,
    setProblems,
    refreshAfterChange,
  };
}

export type DeveloperFiles = ReturnType<typeof useDeveloperFiles>;
