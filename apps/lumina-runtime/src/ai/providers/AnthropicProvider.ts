import type {
  AIProvider,
  GenerateDraftInput,
  GenerateDraftResult,
} from "../AIProvider.js";

export class AnthropicProvider implements AIProvider {
  async generateDraft(
    _input: GenerateDraftInput,
  ): Promise<GenerateDraftResult> {
    throw new Error(
      "anthropic_provider_not_implemented",
    );
  }
}
