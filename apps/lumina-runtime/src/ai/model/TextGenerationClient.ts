export interface TextGenerationInput {
  prompt: string;

  model?: string;
}

export interface TextGenerationResult {
  text: string;

  model: string;
}

export interface TextGenerationClient {
  generateText(
    input:
      TextGenerationInput,
  ): Promise<TextGenerationResult>;
}
