import type {
  ExecutiveAuthority,
} from "./ExecutiveAuthority.js";

export class ExecutiveAuthorityRegistry {

  private readonly authorities =
    new Map<
      string,
      ExecutiveAuthority
    >();

  register(
    authority:
      ExecutiveAuthority,
  ): void {

    this.authorities.set(
      authority.id,
      authority,
    );
  }

  get(
    id: string,
  ) {
    return this.authorities.get(
      id,
    );
  }

  list():
    readonly ExecutiveAuthority[] {

    return Object.freeze(
      Array.from(
        this.authorities.values(),
      ).sort(
        (a, b) =>
          a.priority -
          b.priority,
      ),
    );
  }

  active():
    readonly ExecutiveAuthority[] {

    return this.list().filter(
      (authority) =>
        authority.active,
    );
  }

  clear(): void {
    this.authorities.clear();
  }
}
