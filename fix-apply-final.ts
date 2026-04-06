// replace ONLY applyDraft function

async function applyDraft(draft: DraftFile) {
  const filePath = activeFile;
  const nextContent = draft.content || draft.code || "";

  await fetch("/api/dev/fs/write", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId,
      file: filePath,
      content: nextContent,
    }),
  });

  // 🔥 CRITICAL FIX
  setDrafts([]); // REMOVE drafts so preview uses FS

  setContent(nextContent);
  setVersion((v) => v + 1);
}
