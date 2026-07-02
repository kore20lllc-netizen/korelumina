import type {
  KnowledgeIRItem,
} from "../ir/index.js";

import type {
  KnowledgeValidator,
} from "./KnowledgeValidator.js";

export class KnowledgeValidationRegistry {
  private readonly validators =
    new Map<
      string,
      KnowledgeValidator
    >();

  register(
    validator: KnowledgeValidator,
  ): void {
    const key =
      this.validatorKey(
        validator,
      );

    if (
      this.validators.has(
        key,
      )
    ) {
      throw new Error(
        `Knowledge validator already registered: ${key}`,
      );
    }

    this.validators.set(
      key,
      validator,
    );
  }

  list(): KnowledgeValidator[] {
    return [
      ...this.validators.values(),
    ];
  }

  findSupportingValidators(
    item: KnowledgeIRItem,
  ): KnowledgeValidator[] {
    return this.list().filter(
      (validator) =>
        validator.supports(
          item,
        ),
    );
  }

  clear(): void {
    this.validators.clear();
  }

  private validatorKey(
    validator: KnowledgeValidator,
  ): string {
    return `${validator.name}@${validator.version}`;
  }
}
