import type {
  AIProvider,
  GenerateDraftInput,
  GenerateDraftResult,
} from "../AIProvider.js";

export class GeminiProvider implements AIProvider {
  async generateDraft(
    _input: GenerateDraftInput,
  ): Promise<GenerateDraftResult> {
    throw new Error(
      "gemini_provider_not_implemented",
    );
  }
}
