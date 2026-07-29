import type {
  ExecutiveAuthority,
} from "./ExecutiveAuthority.js";

import {
  ExecutiveAuthorityRegistry,
} from "./ExecutiveAuthorityRegistry.js";

export class ExecutiveAuthorityResolver {

  constructor(
    private readonly registry =
      new ExecutiveAuthorityRegistry(),
  ) {}

  register(
    authority:
      ExecutiveAuthority,
  ): void {

    this.registry.register(
      authority,
    );
  }

  resolve():
    readonly ExecutiveAuthority[] {

    return this.registry.active();
  }

  highestPriority():
    ExecutiveAuthority | undefined {

    return this.resolve().at(
      0,
    );
  }

  registryState() {
    return this.registry;
  }
}
