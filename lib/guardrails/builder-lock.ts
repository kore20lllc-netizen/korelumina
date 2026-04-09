export const LOCKED_CORE_FILES = [
  // Builder
  "app/builder/BuilderInner.tsx",
  "app/builder/BuilderClient.tsx",
  "components/builder/PreviewFrame.tsx",

  // Preview engine
  "app/api/dev/preview/route.ts",

  // 🔥 Master OS (NEW)
  "app/master-os/page.tsx",
  "components/master-os/DiffPanel.tsx",
  "components/master-os/SnapshotPanel.tsx",
  "components/master-os/TaskPanel.tsx",
];

export function isLockedFile(filePath: string) {
  return LOCKED_CORE_FILES.some(f => filePath.includes(f));
}
