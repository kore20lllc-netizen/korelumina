import type { FixGenerator } from "./types.js";
import {
  generate100vwFix,
  generateFaviconFix,
  generateFixedPositionReview,
  generateLockfileFix,
} from "./patchBuilders.js";

export const fixRegistry: FixGenerator[] = [
  {
    match: (finding) => finding.id === "multiple-lockfiles",
    generate: generateLockfileFix,
  },
  {
    match: (finding) => finding.id.startsWith("layout-100vw:"),
    generate: generate100vwFix,
  },
  {
    match: (finding) => finding.id === "missing-favicon",
    generate: generateFaviconFix,
  },
  {
    match: (finding) => finding.id.startsWith("layout-fixed-position:"),
    generate: generateFixedPositionReview,
  },
];
