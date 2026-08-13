# Executive Mutation Governance Specification V1

KoreLumina authorizes `filesystem.replace` only through: Chief Agent `authorize` or `review`, human approval, delegation and acceptance, one-shot execution authorization, execution-start audit, exact project identity, project-scoped `filesystem:write`, exact SHA-256 precondition, existing-file-only atomic replacement, mandatory compensation evidence, and a default-off mutation kill switch. No layer may bypass another.

## Status

Production governance contract.

## Purpose

This specification defines the only permitted live Executive filesystem mutation capability in KoreLumina.

The supported mutation operation is:

`filesystem.replace`

It is not a generic write primitive. It replaces an existing governed project file only when every control in this specification succeeds.

## Reasoning disposition

Chief Agent reasoning must produce one structured disposition:

- `authorize`
- `review`
- `deny`

`authorize` and `review` may create a proposed decision and remain subject to human approval.

`deny` creates a terminal rejected decision.

A denied decision:

- cannot create an approval request;
- cannot be approved through the approval API;
- cannot be delegated;
- cannot create an executable action;
- cannot obtain execution authorization;
- cannot reach an executor.

Human approval is an additional governance gate. It cannot override a Chief Agent `deny`.

## Human approval

An eligible reasoning result creates only a proposed decision.

A proposed decision must receive approval from its designated human approver before delegation.

No approval means no executable action.

## Delegation

Only an approved decision may be delegated.

The delegated actor must explicitly accept the delegation before the associated action may become execution-ready.

## Execution authorization

Execution requires a one-shot authorization bound to:

- the exact action;
- the exact delegation;
- the exact actor.

The authorization must be consumed by the execution-start transition before an executor may run.

A consumed authorization cannot be reused.

## Execution-start audit

Executor invocation requires the exact execution-start audit associated with the action, delegation, actor, and consumed authorization.

The executor cannot be invoked merely by supplying an action ID.

## Project scope

`filesystem.replace` is project-scoped.

The action must carry an exact runtime `projectId`.

The `project-filesystem-replace` executor policy:

- declares `filesystem:write`;
- allows only project scope;
- requires project identity;
- prohibits filesystem delete;
- prohibits process spawning;
- prohibits network requests;
- prohibits Git writes;
- prohibits runtime start, stop, and restart;
- prohibits deployment writes.

Caller-controlled executor selection is forbidden.

The dispatcher and executor registry select the concrete executor.

## Replacement precondition

Every replacement request must include:

- target relative path;
- replacement UTF-8 content;
- exact expected SHA-256 of the existing file.

The target must already exist.

The replacement executor must not create a missing file.

If the current file SHA-256 differs from the expected SHA-256, the mutation fails before bytes are changed.

## Filesystem containment

The replacement target must remain within the governed runtime project root.

Lexical path traversal is rejected.

Resolved symlink escape outside the project root is rejected.

Directory targets are rejected.

## Size limits

Replacement content is bounded.

The existing file snapshot is also bounded.

Oversized replacement or snapshot data is rejected before mutation.

## Atomic replacement

Replacement uses a temporary file in the target directory.

The temporary file is exclusively created, written, flushed with `fsync`, assigned the original permission bits, and atomically renamed over the existing target.

The rename is the mutation boundary.

## Compensation evidence

Every successful replacement must return:

- pre-replacement SHA-256;
- post-replacement SHA-256;
- exact pre-replacement bytes encoded losslessly;
- snapshot byte count;
- project identity;
- target path;
- compensation-required metadata.

A successful mutation cannot transition to governed completion if compensation evidence is missing or malformed.

## Post-mutation failure

Once the atomic rename has changed governed bytes, any later failure is compensation-bearing.

It must produce:

- `compensationRequired: true`;
- the exact pre-replacement snapshot;
- intended post-replacement SHA-256;
- mutation-committed metadata;
- a recovery plan;
- an open failed-execution audit.

A post-mutation failure must never be normalized into an ordinary non-compensating executor error.

## Governed compensation

Compensation is available only for a failed execution with an open compensation obligation.

A snapshot alone is insufficient.

Compensation requires a separate one-time authorization tied to the exact:

- failed execution audit;
- action;
- actor.

Before restoration, the current file must still match the expected post-mutation SHA-256.

This prevents compensation from overwriting a subsequent legitimate change.

Restoration is atomic and must reproduce the exact original bytes.

Successful restoration creates a separate closed `executive-action-execution-compensated` audit.

## Runtime activation

Live mutation is disabled by default.

The only activation flag is:

`LUMINA_EXECUTIVE_MUTATION_ENABLED=true`

The same resolved Boolean controls:

- registration of the `filesystem.replace` executor and policy;
- availability of the mutation HTTP route.

When the flag is absent or not exactly `true`, KoreLumina remains read-only for Executive execution.

## Allowed live Executive filesystem operations

With mutation disabled:

- `filesystem.read`

With mutation explicitly enabled:

- `filesystem.read`
- `filesystem.replace`

No generic `filesystem.write` operation is live.

No delete, process, network, Git-write, runtime-control, or deployment-write Executive executor is authorized by this specification.

## Certification requirements

Production certification must prove both directions.

Negative certification:

1. Chief Agent returns `deny`.
2. Decision becomes `rejected`.
3. No approval request exists.
4. Human approval cannot override the denial.
5. Delegation is rejected.
6. No executable action exists.

Positive certification:

1. Chief Agent returns `authorize` or `review`.
2. Decision remains proposed until human approval.
3. Human approval succeeds.
4. Delegation is created and accepted.
5. Execution authorization is created and consumed.
6. Execution-start audit is created.
7. Exact project identity reaches the action.
8. SHA-guarded disposable replacement succeeds.
9. Compensation evidence is returned.
10. Exact original bytes can be restored by a second governed replacement.
11. Restarting without the mutation flag disables the mutation route.

## Architectural invariant

The live mutation chain is:

Chief Agent governed reasoning
→ eligible structured disposition
→ human approval
→ approved decision
→ delegation
→ delegation acceptance
→ execution authorization
→ authorization consumption
→ execution-start audit
→ project-scoped policy evaluation
→ registry-selected replacement executor
→ exact SHA-256 precondition
→ atomic existing-file replacement
→ compensation evidence
→ governed terminal outcome.

No stage may be skipped.
