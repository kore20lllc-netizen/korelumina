import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useIsMobile,
} from "@/hooks/use-mobile";

import {
  useRuntimeOperations,
} from "@/hooks/useRuntimeOperations";

import {
  useRuntimeWorkspaceSelection,
} from "@/hooks/useRuntimeWorkspaceSelectionV2";

export function useRuntimeOperationsWorkspaceV2() {
  const runtime =
    useRuntimeOperations();

  const selection =
    useRuntimeWorkspaceSelection(
      runtime.snapshot,
    );

  const searchRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    inspectorOpen,
    setInspectorOpen,
  ] = useState(false);

  const isMobile =
    useIsMobile();

  useEffect(() => {
    const handleKeyboardShortcut = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as HTMLElement | null;

      const isTyping =
        Boolean(target) &&
        (
          target?.tagName === "INPUT" ||
          target?.tagName === "TEXTAREA" ||
          target?.isContentEditable
        );

      if (isTyping) {
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (!selection.selectedProject) {
        return;
      }

      const key =
        event.key.toLowerCase();

      if (key === "r") {
        event.preventDefault();

        void runtime.dispatch(
          "restart",
          selection.selectedProject.id,
        );

        return;
      }

      if (key === "s") {
        event.preventDefault();

        void runtime.dispatch(
          "shutdown",
          selection.selectedProject.id,
        );

        return;
      }

      if (key === "Enter") {
        event.preventDefault();
        setInspectorOpen(true);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyboardShortcut,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyboardShortcut,
      );
  }, [
    runtime.dispatch,
    selection.selectedProject,
  ]);

  return {
    ...runtime,
    ...selection,
    searchRef,
    inspectorOpen,
    setInspectorOpen,
    isMobile,
    hasMatches:
      selection.filteredProjects.length >
      0,
  };
}
