import type { AiMode } from "./types";

export function validateAiResponse(data: any, mode: AiMode) {
  if (typeof data !== "object" || data === null) {
    throw new Error("AI response is not an object");
  }

  if (typeof data.summary !== "string") {
    throw new Error("Missing summary field");
  }

  if (!Array.isArray(data.files)) {
    throw new Error("Missing files array");
  }

  for (const file of data.files) {
    if (typeof file.path !== "string") {
      throw new Error("Invalid file path");
    }
    if (typeof file.content !== "string") {
      throw new Error("Invalid file content");
    }
  }

  // Mode-based restrictions
  if (mode === "draft" && data.files.length === 0) {
    throw new Error("Draft mode must include at least one file");
  }

  if (mode === "patch") {
    // future: enforce patch-only changes
  }

  if (mode === "execute") {
    // future: enforce execution constraints
  }

  return true;
}
