import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import type {
  KnowledgeValidator,
} from "./KnowledgeValidator.js";

import {
  KnowledgeValidationRegistry,
} from "./KnowledgeValidationRegistry.js";

export class KnowledgeValidationPipeline {
  constructor(
    private readonly registry: KnowledgeValidationRegistry,
  ) {}

  async validate(
    items: readonly KnowledgeIRItem[],
  ): Promise<
    KnowledgeIRItem[]
  > {
    const output: KnowledgeIRItem[] =
      [];

    for (const item of items) {
      output.push(
        await this.validateItem(
          item,
        ),
      );
    }

    return output;
  }

  private async validateItem(
    item: KnowledgeIRItem,
  ): Promise<
    KnowledgeIRItem
  > {
    let current = item;

    const validators =
      this.registry.findSupportingValidators(
        current,
      );

    for (const validator of validators) {
      current =
        await this.apply(
          validator,
          current,
        );
    }

    return current;
  }

  private async apply(
    validator: KnowledgeValidator,
    item: KnowledgeIRItem,
  ): Promise<
    KnowledgeIRItem
  > {
    return validator.validate(
      item,
    );
  }
}
