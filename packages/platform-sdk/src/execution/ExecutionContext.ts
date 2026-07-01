export interface ExecutionContext<
  TInput = unknown,
  TState extends Record<string, unknown> = Record<string, unknown>,
> {
  id: string;

  input: TInput;

  state: TState;

  metadata: Record<
    string,
    unknown
  >;
}
