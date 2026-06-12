import { NotImplementedError } from "@/lib/errors";
import type { AIProvider } from "@/providers/types";

/**
 * Real OpenAI / Lovable AI Gateway adapter. Routes orchestrate calls through
 * an edge function so the API key never reaches the browser. Not yet wired.
 */
export class OpenAIProvider implements AIProvider {
  orchestrate(): never { throw new NotImplementedError("OpenAIProvider.orchestrate"); }
  applyDraft(): never { throw new NotImplementedError("OpenAIProvider.applyDraft"); }
}