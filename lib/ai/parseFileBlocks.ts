export function parseFileBlocks(text: string) {
  const blocks = text.split("FILE:");
  const files: { path: string; content: string }[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const firstLineEnd = trimmed.indexOf("\n");
    if (firstLineEnd === -1) continue;

    const rawPath = trimmed.slice(0, firstLineEnd).trim();
    let content = trimmed.slice(firstLineEnd + 1);

    const filePath = rawPath.replace(/^\/+/, "").trim();

    # strip markdown fences if the model wrapped code
    content = content
      .replace(/```[a-zA-Z]*\n?/g, "")
      .replace(/```/g, "")
      .trim();

    files.push({
      path: filePath,
      content,
    });
  }

  return files;
}
