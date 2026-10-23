import { AnthropicTextGenerationClient } from "../model/index.js";
import { TextModelDraftProvider } from "./TextModelDraftProvider.js";

/* MS-2026-0011: Claude drafts changes for the Developer AI Assist. */
export class AnthropicProvider extends TextModelDraftProvider {
  constructor(
    client = new AnthropicTextGenerationClient({ maxTokens: 16000 }),
  ) {
    super("anthropic", client);
  }
}
