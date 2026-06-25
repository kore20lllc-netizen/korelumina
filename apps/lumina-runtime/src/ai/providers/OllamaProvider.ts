import type {
  AIProvider,
  GenerateDraftInput,
  GenerateDraftResult,
} from "../AIProvider.js";

export class OllamaProvider implements AIProvider {
  async generateDraft(
    _input: GenerateDraftInput,
  ): Promise<GenerateDraftResult> {
    throw new Error(
      "ollama_provider_not_implemented",
    );
  }
}
