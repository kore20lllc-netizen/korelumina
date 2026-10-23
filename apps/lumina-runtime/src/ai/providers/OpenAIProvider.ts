import { OpenAITextGenerationClient } from "../model/index.js";
import { TextModelDraftProvider } from "./TextModelDraftProvider.js";

export class OpenAIProvider extends TextModelDraftProvider {
  constructor(client = new OpenAITextGenerationClient()) {
    super("openai", client);
  }
}
