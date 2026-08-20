# Historical Replay Contract V1

Status: Architecture Contract  
Version: 1.0  
Subsystem: Genesis / Knowledge Preservation  
Owner: Knowledge Platform  
Scope: Historical Replay and Genesis Corpus construction  
Authority: Subordinate to the KoreLumina Constitution, approved constitutional amendments, and Constitutional Document Governance

---

# 1. Purpose

Historical Replay is the governed process that reconstructs KoreLumina's prior engineering activity into a deterministic, provenance-preserving historical source stream suitable for Knowledge Preservation and pre-activation education.

Historical Replay exists to recover what KoreLumina learned while it was being built.

It does not exist to reproduce the repository mechanically, fabricate unavailable historical state, or grant historical artifacts authority they did not possess.

Historical Replay produces the governed source foundation for the Genesis Corpus.

The lifecycle is:

Historical Sources

↓

Historical Source Discovery

↓

Genesis Source Manifest

↓

Deterministic Historical Replay

↓

Evidence Admission

↓

Knowledge Preservation

↓

Knowledge IR

↓

Validation

↓

Knowledge Package

↓

Canonical Review

↓

Explicit Canonical Promotion where approved

↓

Canonical Knowledge

↓

Governed Organizational Memory Adaptation where approved

↓

Educational Corpus

Historical Replay ends at Evidence Admission.

All downstream knowledge transformation remains owned by the existing Knowledge Operations lifecycle.

---

# 2. Constitutional Boundary

Historical Replay belongs to the Knowledge Preservation and Knowledge Platform boundary.

Historical Replay is not:

- Runtime execution;
- Knowledge Manufacturing Replay;
- Canonical Knowledge;
- Organizational Memory;
- Chief Agent memory;
- Chief Agent operational control;
- autonomous learning;
- a substitute for human governance.

Historical Replay MUST NOT:

- directly create Canonical Knowledge;
- directly create Organizational Memory;
- automatically approve Knowledge Packages;
- automatically promote reviewed knowledge;
- bypass validation;
- bypass Canonical Review;
- convert raw conversations directly into canonical knowledge;
- rewrite historical evidence to fit the current architecture;
- fabricate historical events that cannot be evidenced.

The existing Knowledge Operations governance boundaries remain authoritative.

---

# 3. Historical Replay vs Manufacturing Replay

`KnowledgeManufacturingReplayService` is a certification and visualization mechanism over an already-existing Knowledge Manufacturing Run.

It is intentionally ephemeral.

It does not perform historical recovery.

Genesis Historical Replay is a separate subsystem.

The distinction is mandatory:

Historical Replay:

Historical source
→ discovery
→ manifest
→ chronological reconstruction
→ evidence admission

Manufacturing Replay:

Existing manufacturing run
→ stage visualization / certification playback

No implementation may alias these concepts.

No Genesis implementation may repurpose `KnowledgeManufacturingReplayService` as the Historical Replay engine.

---

# 4. Recovery Source Hierarchy

Historical source discovery follows the recovery priority established by Repository Knowledge Recovery:

1. ADRs
2. RFCs
3. Architecture documents
4. Specifications
5. Roadmaps
6. Source files
7. Git history
8. Runtime events
9. Conversations
10. Engineering executions

This hierarchy governs:

- discovery priority;
- authority reconciliation;
- conflict interpretation;
- recovery sequencing by source class.

Historical Source discoverers MUST declare the source classes they own.

Discovery aggregation MUST execute discoverers deterministically by recovery source-class priority and then stable discoverer identity.

Discovery ordering is not replay chronology.

After discovery and manifest construction, chronological replay ordering remains governed separately by historical timestamp, source-class priority, provenance locator, and Historical Source Identity.

It does NOT redefine historical chronology.

Recovery priority and historical time are separate dimensions.

---

# 5. Historical Chronology

Historical Replay reconstructs events according to historical time after sources have been discovered and authority-classified.

Primary chronological ordering uses the best available native source timestamp.

Examples include:

- Git commit author/committer timestamps;
- ADR approval or creation timestamps;
- document version timestamps;
- runtime event timestamps;
- conversation timestamps;
- incident timestamps;
- build timestamps;
- engineering execution timestamps.

Historical Replay MUST preserve the original timestamp value and timestamp source.

Historical Replay MUST NOT silently replace historical timestamps with replay time.

Replay time and historical time are separate fields.

---

# 6. Deterministic Ordering

Historical Replay MUST be deterministic.

Given:

- the same replay scope;
- the same source versions;
- the same authority rules;
- the same replay-contract version;

the resulting ordered source manifest MUST be identical.

Ordering uses the following deterministic tuple:

1. historical timestamp;
2. source-class priority;
3. stable provenance locator;
4. source identity.

The stable provenance locator is source-native whenever possible.

Examples:

Git:
- commit SHA

Document:
- repository-relative stable provenance locator

Conversation:
- conversation identifier plus message/event sequence

Runtime event:
- runtime event identifier

Engineering execution:
- execution identifier

If two sources have the same timestamp, the source-class priority provides deterministic ordering without changing either source's historical timestamp.

If both timestamp and source class are identical, provenance locator and stable source identity break the tie.

Filesystem iteration order MUST NOT influence replay order.

Object insertion order MUST NOT influence replay order.

Database return order MUST NOT influence replay order unless explicitly included in the deterministic contract.

---

# 7. Historical Source Identity

Every replayable historical source MUST have an immutable Historical Source Identity.

Format:

`genesis-source:<source-class>:<stable-source-key>`

The stable source key MUST originate from source-native identity where available.

Examples:

`genesis-source:commit:<commit-sha>`

`genesis-source:document:<checksum>`

`genesis-source:conversation:<conversation-id>:<sequence>`

`genesis-source:runtime-event:<event-id>`

Historical Source Identity MUST NOT depend on:

- replay execution time;
- local filesystem absolute path;
- process ID;
- random UUID generation;
- array position;
- current machine identity.

If a source lacks a native immutable identifier, its source identity MUST be deterministically derived from its stable provenance locator.

The content checksum MUST remain separate from Historical Source Identity.

A checksum change for the same Historical Source Identity is the signal used to detect source mutation or historical version change.

The checksum MUST NOT participate in fallback Historical Source Identity because doing so would transform a mutation of an existing source into an apparently unrelated source.

---

# 8. Source Manifest

Historical discovery produces a Genesis Source Manifest before replay begins.

The manifest is the governed inventory of source material selected for replay.

Each manifest entry MUST contain at minimum:

- historicalSourceId;
- sourceType;
- evidenceType;
- authorityClass;
- approvalState where applicable;
- provenanceLocator;
- sourceChecksum;
- historicalTimestamp;
- historicalTimestampSource;
- discoveredAt;
- discoveryMethod;
- replayEligibility;
- exclusionReason when excluded;
- supersession references where known;
- conflict references where known;
- metadata sufficient for Evidence construction.

The manifest MUST preserve source identity even when the source is excluded from replay.

An exclusion removes a source from evidence admission.

It does not erase the fact that the source existed.

---

# 9. Manifest Identity

Each Genesis Source Manifest MUST have a deterministic identity.

Manifest identity is derived from:

- replay-contract version;
- replay scope;
- ordered historical source identities;
- source checksums;
- applicable governance configuration.

Changing any authoritative source content changes the manifest identity.

Changing replay scope changes the manifest identity.

Changing only replay execution time MUST NOT change the manifest identity.

Genesis Source Manifest construction MUST consume the governed Historical Source discovery aggregate rather than bypassing discoverer validation or deduplication.

Documentation Discovery and Git History Discovery are the first concrete V1 inputs to the default Genesis manifest builder.

The manifest contains deterministic source state only. Discovery diagnostics, discoverer execution identity, and discovery-observation multiplicity remain adjacent build diagnostics and MUST NOT be injected into manifest identity unless they alter the discovered Historical Source set itself.

Manifest entry order MUST follow the existing replay-order tuple:

1. historical timestamp;
2. source-class priority;
3. provenance locator;
4. Historical Source Identity.

The manifest builder MUST NOT admit Evidence, compile Knowledge IR, create Knowledge Packages, promote Canonical Knowledge, or adapt Organizational Memory.

Manifest construction MUST use the same canonical ordering implementation that governs manifest identity. A second independently maintained replay-order comparator MUST NOT become a competing source of truth.

A successfully materialized manifest is not automatically replay-ready.

If discovery returns any unresolved error, the manifest build result MUST be classified `BLOCKED` even when some Historical Sources were successfully discovered and a deterministic diagnostic manifest can be materialized.

A `BLOCKED` manifest build MUST NOT enter replay execution until its discovery errors are reconciled.

Replay orchestration MUST require an explicit manifest-build readiness gate before creating or starting replay state.

Discovery errors MUST therefore never be silently converted into a smaller apparently-complete Genesis Corpus.

Before replay execution, a Replay Plan MUST be derived from a `READY` Genesis Source Manifest build.

The Replay Plan MUST reuse the existing deterministic Replay Identity contract. It MUST NOT define a second replay identifier.

Replay Plan sequence MUST preserve manifest order exactly. The planner MUST NOT independently reorder Historical Sources.

Each manifest entry is classified:

- `eligible` -> planned action `ADMIT`;
- `excluded` -> planned action `SKIP_SCOPE`;
- `blocked` -> planned action `BLOCK`.

`SKIP_SCOPE` means the Historical Source is outside the already-governed Replay Scope. It is not a generic governance approval to discard knowledge.

Every `SKIP_SCOPE` action MUST retain the explicit governed scope-exclusion reason.

Replay planning MUST distinguish deterministic scope exclusion from any future human- or policy-approved skip decision.

During later execution, a valid `SKIP_SCOPE` plan action may produce the terminal replay disposition `SKIPPED` while retaining its governed scope reason. Other forms of `SKIPPED` disposition require their own governance basis.

Planning an `ADMIT` action is not Evidence admission. Planning MUST NOT create Evidence or advance replay execution state.

A plan containing any `BLOCK` action is itself `BLOCKED` and MUST NOT be started until the blocked Historical Source is reconciled.

A `BLOCKED` manifest build MUST NOT produce a Replay Plan.

Replay Plan entries MUST retain Historical Source Identity, manifest position, and source checksum so later execution can verify that the source being processed is the source that was planned.

Replay Execution V1 MUST consume only a `READY` Replay Plan.

Before execution starts, and again before each source is processed, execution MUST verify:

- Replay Identity matches the manifest, replay contract, and scope;
- manifest identity matches the plan;
- plan length matches manifest length;
- planned manifest position matches the current manifest position;
- Historical Source Identity matches;
- source checksum matches;
- planned action remains consistent with manifest replay eligibility.

Execution MUST process exactly one deterministic manifest position per execution step.

`SKIP_SCOPE` MUST NOT invoke Evidence admission. It becomes terminal replay disposition `SKIPPED` while retaining its governed scope-exclusion reason.

`ADMIT` MUST cross only an explicit Genesis Replay Admission Adapter boundary.

The Admission Adapter is an interface boundary, not the Knowledge Operations implementation.

Every `ADMIT` request MUST carry a deterministic Genesis Admission Identity representing one repository-scoped Historical Source version.

Genesis Admission Identity MUST be derived from:

- repository identity;
- Historical Source Identity;
- source checksum;
- Evidence type;
- provenance locator.

Genesis Admission Identity MUST NOT include Replay Identity, manifest identity, manifest position, or execution time.

Replay, manifest, manifest-position, and execution-time values are admission-occurrence provenance. They MUST remain traceable but MUST NOT create a second Evidence identity for an unchanged Historical Source version.

Therefore, the same unchanged Historical Source version encountered by multiple replay manifests or scopes MUST resolve to the same Genesis Admission Identity and the same durable Evidence identity.

A changed source checksum represents a different Historical Source version and MUST produce a different Genesis Admission Identity.

Repository namespace MUST participate in identity so equivalent native/path identities from separate repositories do not collide.

Repeated admission of the same Genesis Admission Identity MUST resolve to the same durable Evidence identity or fail as an idempotency conflict.

Repeated observations of that identity from different replays MUST preserve the additional replay/manifest occurrence lineage even when no new Evidence object is created.

Genesis does not require the future production Evidence store to use the Genesis Admission Identity as its own Evidence ID. The production adapter MUST preserve an explicit mapping between them.

Admission payload transfer MUST preserve at minimum:

- Evidence type;
- Historical Source Identity;
- source checksum;
- provenance/content reference;
- historical observation timestamp;
- execution capture timestamp;
- Replay Identity;
- manifest identity and manifest position;
- authority classification;
- historical timestamp source.

Historical observation time and replay capture time MUST remain distinct.

A synthetic admission adapter MAY materialize in-memory Evidence for end-to-end Genesis testing, but it MUST validate that synthetic Evidence against the existing Evidence Intake Contract and MUST NOT write to production Knowledge Operations storage.

A successful admission adapter call MUST return a non-empty Evidence identity before replay state may advance to terminal `ADMITTED`.

Admission failure MUST be replay-atomic.

If the admission adapter throws, rejects, or fails to return a valid Evidence identity:

- the current manifest position MUST NOT advance;
- no new terminal disposition may be recorded;
- replay state MUST remain unchanged;
- the last valid checkpoint MUST remain unchanged;
- no synthetic checkpoint may be created for the failed attempt.

Replay Execution V1 MUST NOT directly instantiate, call, or modify the production Knowledge Operations Evidence intake implementation.

After every terminal execution step, replay state and checkpoint MUST advance together over the same completed manifest prefix.

Checkpoint creation MUST continue to use the existing checksum-through-checkpoint integrity contract.

An empty READY replay may complete without creating a checkpoint because no manifest source has reached a terminal disposition.

Replay Runner V1 composes the existing governed pipeline:

READY Manifest Build
→ Replay Plan
→ Replay Execution
→ terminal execution steps
→ final runner outcome

The runner MUST NOT define a second manifest, planning, execution, state, checkpoint, or admission model.

Replay Runner V1 MUST execute manifest positions sequentially through the existing Replay Execution contract.

The runner MUST stop immediately on the first failed execution step.

A runner failure MUST return:

- outcome `FAILED`;
- the failed manifest position;
- the failed Historical Source Identity when available;
- the failure message;
- the last valid Replay Execution snapshot;
- the last valid checkpoint.

Runner failure MUST NOT synthesize a terminal source disposition for the failed attempt.

Runner failure MUST NOT advance the failed manifest position.

Runner failure MUST NOT execute any later manifest position.

The last-valid execution state may therefore remain `running` at the failed position while the runner outcome is `FAILED`. Runner outcome and replay-state position are separate truths and MUST NOT be conflated.

A successfully exhausted plan returns runner outcome `COMPLETED` only when the existing Replay State has reached `completed`.

Replay Runner timestamps MUST be provided by an explicit execution-time source. The runner MUST NOT introduce hidden wall-clock ordering into deterministic replay behavior.

Replay Runner V1 MUST remain independent from persistence, runtime routes, UI, and the production Knowledge Operations admission adapter.

A failed replay MAY be restarted from the beginning of the same deterministic manifest.

Runner restart safety depends on the Genesis Admission Identity idempotency contract.

When a restarted replay encounters an unchanged Historical Source version that was successfully admitted during an earlier failed attempt:

- it MUST resolve to the same Genesis Admission Identity;
- the admission adapter MUST reuse the same durable Evidence identity;
- a duplicate Evidence object MUST NOT be created;
- the replay may reconstruct its state/checkpoint deterministically from the beginning;
- repeating the same replay/manifest/position occurrence MUST NOT create duplicate occurrence provenance.

A later Historical Source that was never successfully admitted remains independently admissible during the retry.

Runner restart therefore provides at-least-once execution attempts with effectively-once Evidence creation per repository-scoped Historical Source version.

Replay Persistence V1 introduces durable Genesis replay state under the established runtime-data root.

The default persistence namespace is:

`runtime-data/genesis/replays/<safe-replay-storage-key>/`

Genesis replay persistence MUST remain physically isolated from production `runtime/knowledge` stores.

Replay persistence MUST retain separately:

- Genesis Source Manifest build result;
- current Replay Execution snapshot;
- latest Runner Result.

The persisted Replay Execution snapshot includes the existing Replay Plan, manifest, Replay State, and checkpoint. Persistence MUST NOT introduce competing lifecycle models for those artifacts.

Every persisted artifact MUST remain bound to the deterministic Replay Identity.

Loading persisted state MUST reject identity drift or manifest/replay mismatch rather than silently accepting tampered replay artifacts.

File persistence MUST use atomic replacement semantics so a partially-written JSON document cannot become the authoritative replay artifact.

If a persisted JSON artifact is corrupted or truncated, Genesis MUST fail closed with an explicit corruption error.

Corrupted persistence MUST NOT be interpreted as "not found", MUST NOT be silently replaced with an empty replay, and MUST NOT be deleted automatically. The artifact remains available for diagnosis and governed recovery.

A deserialized Replay Execution snapshot MUST NOT be trusted merely because its outer Replay Identity is valid.

When a checkpoint exists, persistence MUST independently revalidate it through the existing checkpoint-resume integrity contract against the persisted manifest, including:

- Replay Identity;
- manifest identity;
- replay contract version;
- completed-prefix coverage;
- Historical Source identities;
- source checksums.

Replay State and checkpoint MUST also agree on the last completed manifest position and disposition count.

A Replay State containing a completed prefix MUST NOT load successfully if its checkpoint is absent.

After every successfully resumed terminal source step, the updated Replay Execution snapshot MUST be persisted before the next manifest position is attempted.

If resumed admission fails, the persisted execution snapshot MUST remain at the last successfully persisted checkpoint. The failed attempt MUST NOT advance durable replay state.

A persisted failed Runner Result is diagnostic state. It MUST NOT mutate the last valid Replay Execution snapshot.

Resume MUST continue from the persisted `currentManifestIndex`; it MUST NOT replay an already-completed manifest prefix merely because the process restarted.

Tests for Replay Persistence MUST use isolated temporary storage roots and MUST NOT write synthetic Genesis artifacts into production `runtime-data/genesis` or production Knowledge Operations stores.

Production Evidence Admission Adapter V1 is the first governed bridge from Genesis Replay into the certified Knowledge Operations lifecycle.

The production adapter MUST reuse the existing `KnowledgePreservationPlatform.preserve()` boundary. Genesis MUST NOT create a parallel Evidence Intake implementation.

The adapter MUST accept only Replay Plan action `ADMIT` for a manifest source that remains `eligible`.

Before production admission, the adapter MUST preserve the deterministic Genesis Admission Identity and deterministic Evidence identity contract.

A repeated unchanged Historical Source version MUST reuse the same durable Evidence identity and MUST NOT create a second Knowledge Manufacturing Run.

The existing Knowledge Manufacturing Run is the durable production witness that the deterministic Evidence identity has already entered Knowledge Operations.

Genesis admission is concerned with successful Evidence Intake, not with silently replacing downstream Knowledge Operations governance.

If Evidence Intake completed but a later Knowledge Operations manufacturing stage fails, the existing manufacturing run remains authoritative for that downstream failure. Genesis MUST NOT manufacture a second Evidence object or second run to retry the same source version.

If Evidence Intake itself did not complete, the production adapter MUST fail and Genesis Replay MUST NOT record terminal `ADMITTED`.

A downstream Knowledge Operations failure that occurs after Evidence Intake completed MUST NOT cause Genesis to create a second Evidence object or second Knowledge Manufacturing Run on retry.

The pre-existing failed manufacturing run remains authoritative for that source-version admission. Genesis may truthfully retain `ADMITTED` at its Evidence boundary while Knowledge Operations truthfully retains the downstream manufacturing failure.

An Evidence Intake failure is different. A run whose Evidence Intake stage never completed MUST NOT be interpreted as prior successful Genesis admission.

Retrying the same failed-intake source version MUST remain non-admitted unless a future governed recovery mechanism explicitly resolves that failed Knowledge Manufacturing Run. The adapter MUST NOT bypass or replace the failed run merely to force replay progress.

Production admission MUST continue through the existing certified Knowledge Operations lifecycle and MUST preserve the existing Canonical Review governance boundary.

Genesis MUST NOT automatically approve Canonical Review, promote Canonical Knowledge, or adapt Organizational Memory.

Production-adapter tests MUST execute under isolated test Knowledge storage and MUST NOT mutate legitimate production `runtime/knowledge`.

Governed Replay Orchestrator V1 is the explicit composition boundary for end-to-end Genesis Replay.

The orchestrator MUST compose existing contracts rather than replace them:

Default Historical Source Discovery
→ Genesis Source Manifest Build
→ Replay Plan
→ persistence preflight
→ explicit execution authorization
→ persisted Replay Execution
→ Production Evidence Admission Adapter
→ persisted Runner Result

The orchestrator supports two explicit modes: `DRY_RUN` and `PRODUCTION_ADMISSION`.

`DRY_RUN` MUST perform discovery, deterministic manifest construction, Replay Plan construction, and persistence-isolation preflight only.

`DRY_RUN` MUST NOT create Replay Execution state, persist replay artifacts, invoke Evidence admission, or mutate Knowledge Operations.

`PRODUCTION_ADMISSION` MUST require an explicit production-admission authorization flag. Selecting production mode alone is insufficient authorization.

Production execution MUST NOT begin unless all of the following are true:

- Historical Source discovery produced a `READY` manifest build with no unresolved errors;
- Replay Plan is `READY` with no `BLOCK` action;
- Genesis replay persistence is isolated from production `runtime/knowledge`;
- a certified Knowledge Preservation Platform is supplied;
- production admission was explicitly authorized.

Before the first production Evidence admission, the orchestrator MUST persist the manifest build and the initial Replay Execution snapshot.

Persistence of those initial artifacts is a hard production-admission barrier.

If manifest persistence fails:

- Replay Execution MUST NOT be persisted;
- the Production Evidence Admission Adapter MUST NOT be invoked;
- Knowledge Operations MUST remain unchanged.

If initial Replay Execution persistence fails:

- production Evidence admission MUST NOT begin;
- no Knowledge Manufacturing Run may be created for the attempted replay;
- Knowledge Operations MUST remain unchanged.

Genesis MUST therefore establish a durable recovery point before crossing the production Evidence boundary.

There MUST NOT be a window in which production Knowledge Operations has changed while Genesis lacks its initial durable replay execution snapshot.

The orchestrator MUST use the existing Production Evidence Admission Adapter and persisted replay-resume contract. It MUST NOT implement a second admission loop.

An already-persisted replay execution MUST NOT be silently overwritten, restarted, or resumed by the start-orchestration command. Existing execution requires an explicit future resume/recovery command.

The orchestrator MUST NOT expose runtime routes or UI controls in V1.

Constructing an orchestrator input, building a dry-run plan, or performing preflight MUST NEVER implicitly start production replay.

Explicit Replay Resume / Recovery Orchestrator V1 is the only governed boundary for reopening an already-persisted Genesis replay.

Recovery MUST be addressed by deterministic Replay Identity.

Recovery MUST load the existing persisted Manifest Build and Replay Execution snapshot. It MUST NOT perform Historical Source discovery, rebuild a manifest, rebuild a Replay Plan, create a replacement initial Replay Execution, or overwrite the replay merely because recovery was requested.

Loading the persisted Replay Execution MUST reuse the existing persistence integrity checks for Replay Identity, manifest identity, Replay State, checkpoint position, completed-prefix Historical Source identities, and source checksums.

Recovery supports two explicit modes: `INSPECT` and `PRODUCTION_RECOVERY`.

`INSPECT` MAY load and report persisted replay state and recovery preflight, but MUST NOT invoke Evidence admission or advance Replay State.

`PRODUCTION_RECOVERY` MUST require explicit production-recovery authorization. Selecting recovery mode alone is insufficient authorization.

Production recovery also requires the certified Knowledge Preservation Platform and isolated Genesis replay persistence.

A persisted replay is resumable only when its Replay State is `running` and its persisted current manifest position is non-null.

Recovery MUST continue strictly from the persisted `currentManifestIndex` through the existing persisted replay-resume contract.

Already-completed manifest positions MUST NOT be replayed by recovery.

A completed replay MUST NOT be restarted through the recovery orchestrator.

Production recovery is failure-atomic at the persisted replay boundary.

If the first resumed production admission fails:

- the failed manifest position MUST NOT advance;
- no new terminal replay disposition may be persisted;
- the last completed manifest position MUST remain unchanged;
- the last valid checkpoint MUST remain unchanged;
- no later manifest position may execute;
- the failed Runner Result MAY be persisted diagnostically without mutating the authoritative Replay Execution snapshot.

A recovery failure after any later resumed position follows the same rule: durable Replay Execution may advance only through successfully completed terminal source steps.

Recovery MUST NOT silently replace an existing failed or running replay with newly discovered history or a newly constructed replay identity.

The start orchestrator and recovery orchestrator therefore have non-overlapping responsibilities:

- start orchestration creates a new persisted replay and refuses existing execution;
- recovery orchestration opens only an existing persisted replay and refuses rebuild/restart semantics.

Replay Recovery Orchestrator V1 MUST NOT expose routes or UI controls.

Replay Status / Inspection Service V1 is a strictly read-only projection over existing persisted Genesis replay artifacts and existing Knowledge Manufacturing Runs.

The status service MUST NOT perform Historical Source discovery, build or rebuild a manifest, construct a Replay Plan, create or advance Replay Execution, invoke Evidence admission, invoke recovery, or write persistence.

Its persistence dependency MUST be limited to read operations for:

- persisted Manifest Build;
- persisted Replay Execution;
- persisted Runner Result.

Its Knowledge Operations dependency MUST be limited to read-only listing of existing Knowledge Manufacturing Runs.

Status inspection MAY report:

- Replay Identity;
- persisted manifest presence and readiness;
- manifest source count;
- Replay Execution status and corpus status;
- current manifest position and Historical Source;
- last completed manifest position;
- Replay progress;
- current checkpoint;
- latest persisted Runner Result outcome and failure;
- recovery eligibility;
- admitted Evidence identities;
- linkage from admitted Evidence identities to existing Knowledge Manufacturing Runs;
- linked manufacturing stage, run status, package identity, and Canonical Knowledge identities when already present.

Inspection MUST NOT fabricate Knowledge Manufacturing linkage when no run exists for an admitted Evidence identity.

If more than one Knowledge Manufacturing Run references the same admitted Evidence identity, inspection MUST report the linkage as ambiguous.

In that ambiguous condition:

- every matching manufacturing-run identity MUST remain visible;
- no single run may be presented as authoritative;
- run status, current stage, package identity, and Canonical Knowledge linkage MUST remain unresolved in the authoritative projection;
- aggregate "all admitted Evidence linked" status MUST remain false until ambiguity is resolved.

Inspection MUST NOT silently select the newest, oldest, first, or last duplicate run.

Recovery eligibility reported by inspection is informational only. It MUST NOT authorize or start recovery.

A replay is inspection-recoverable only when a persisted execution exists, its state is `running`, and its persisted current manifest position is non-null.

Completed replay state MUST be reported as not recovery eligible.

Persistence corruption, identity drift, checkpoint corruption, or manifest mismatch discovered by existing persistence load validation MUST fail closed. Inspection MUST NOT suppress or reinterpret those integrity failures.

Replay Status / Inspection Service V1 MUST NOT expose routes or UI controls.

Replay Runtime API Read Model V1 exposes the certified Replay Status / Inspection Service through one read-only runtime endpoint:

`GET /api/runtime/genesis/replays/:replayId/status`

The runtime API MUST reuse the existing runtime access-control middleware. Genesis MUST NOT create a parallel authentication or trust model.

An unauthorized non-loopback request MUST be rejected by the established runtime access boundary before the Genesis status handler is invoked.

A request carrying the valid configured internal runtime token MAY pass that existing runtime access boundary according to the runtime security contract.

Milestone 20 MUST NOT weaken, special-case, bypass, duplicate, or replace `requireRuntimeAccess`.

The route MUST validate Replay Identity before any persistence lookup.

A wire-level Replay Identity is valid only when it matches the deterministic Replay Identity format produced by Genesis: `genesis-replay:` followed by exactly 64 lowercase hexadecimal characters.

Malformed Replay Identity MUST return a client error and MUST NOT access Genesis persistence.

A valid Replay Identity with no persisted replay MUST return not-found.

Persistence corruption, Replay Identity drift, checkpoint corruption, manifest mismatch, or another persistence-integrity failure MUST remain distinguishable from not-found.

The API MUST fail closed and expose the governed integrity error rather than fabricating an empty replay status.

The route MUST delegate status construction to the existing Replay Status / Inspection Service. It MUST NOT duplicate replay projection logic in the transport layer.

Milestone 20 exposes no replay mutation API.

Milestone 20 MUST NOT expose HTTP endpoints for:

- Historical Source discovery;
- manifest construction;
- Replay Plan creation;
- replay start;
- production Evidence admission;
- replay resume;
- replay recovery;
- checkpoint mutation;
- Runner Result mutation.

The runtime route dependency surface MUST remain read-only for both Genesis persistence and Knowledge Manufacturing Runs.

Milestone 20 MUST NOT add Builder UI or Builder API consumers.

Replay Runtime API Inspection Integration V1 certifies the Milestone 20 read model across the real HTTP transport and real Genesis file-persistence implementation.

Milestone 21 MUST NOT add a second production endpoint or alter the certified Milestone 20 route contract.

Integration tests MUST exercise the actual `registerGenesisReplayStatusRoute` composition through an HTTP server rather than invoking the route handler directly.

Integration tests MUST use `FileGenesisReplayPersistenceStore` against an isolated temporary storage root.

Integration fixtures MUST NOT write into legitimate `runtime-data/genesis`, production `runtime/knowledge`, or another operational Knowledge store.

Milestone 21 MUST certify at least:

- malformed Replay Identity returns client error through real HTTP;
- valid deterministic Replay Identity with no persisted replay returns not-found;
- a controlled persisted replay fixture is projected successfully through HTTP;
- loopback access follows the existing `requireRuntimeAccess` contract without introducing Genesis-specific authentication rules;
- corrupt persisted Genesis JSON fails closed through HTTP and is not rewritten or deleted by inspection.

The integration layer MUST NOT invoke discovery, manifest construction for production history, production Evidence admission, replay start orchestration, recovery orchestration, or any Knowledge mutation operation.

Controlled manifest/execution fixture construction inside isolated test storage is permitted solely to establish deterministic read-model test state.

Integration certification MUST NOT weaken the Milestone 20 guarantee that the runtime exposes exactly one Genesis HTTP path and that path is read-only.

Milestone 21 MUST NOT add Builder UI or Builder API consumers.

Genesis Replay Listing / Inventory Read Model V1 provides read-only enumeration of persisted Genesis replay identities and their certified status projections.

Inventory authority comes exclusively from persisted Genesis replay artifacts.

Knowledge Manufacturing Runs MUST NOT create, imply, or invent Genesis replay inventory records.

The inventory service MUST NOT perform Historical Source discovery, manifest construction, Replay Plan construction, replay execution, Evidence admission, recovery, or persistence writes.

The persisted replay directory name is a SHA-256 storage key and MUST NOT itself be treated as Replay Identity.

Inventory MUST recover Replay Identity only from persisted replay artifacts that explicitly contain that identity.

After recovering a Replay Identity, inventory MUST verify that the containing persistence-directory name equals the deterministic SHA-256 storage key for that Replay Identity.

A directory/replay identity mismatch MUST fail closed.

If multiple persisted artifacts in one directory declare different Replay Identities, inventory MUST fail closed as identity ambiguity.

Corrupt persisted JSON encountered during inventory MUST fail closed.

A manifest-only persistence directory does not explicitly store Replay Identity as a field, but Replay Identity is deterministically derivable from the persisted manifest identity contract.

For manifest-only persistence, inventory MAY reconstruct Replay Identity only by applying the existing `createGenesisReplayId` contract to the persisted manifest's `manifestId`, `replayContractVersion`, and `scope`.

Inventory MUST NOT derive Replay Identity from the hashed directory name.

After manifest-derived Replay Identity reconstruction, inventory MUST still verify that the persistence-directory name equals the deterministic SHA-256 storage key for that Replay Identity.

If manifest-derived Replay Identity conflicts with a Replay Identity declared by persisted execution or Runner Result state, inventory MUST fail closed as identity ambiguity.

The existing persistence loader remains the final artifact-integrity authority. Manifest-derived inventory identity does not bypass `loadManifestBuild` validation.

For each valid persisted Replay Identity, the inventory service MUST delegate its status projection to the existing Replay Status / Inspection Service.

Inventory ordering MUST be deterministic.

Genesis Replay Listing / Inventory Read Model V1 MUST NOT expose runtime routes or Builder UI.

Genesis Replay Inventory Runtime API V1 exposes the certified replay inventory through one additional read-only runtime endpoint:

`GET /api/runtime/genesis/replays`

The endpoint MUST reuse the existing `requireRuntimeAccess` middleware and MUST NOT establish a Genesis-specific authentication boundary.

The runtime transport MUST delegate inventory construction to `listGenesisReplayInventory`.

The route MUST NOT reproduce Replay Identity derivation, directory verification, artifact validation, status projection, or Knowledge Manufacturing linkage logic.

An empty persisted Genesis store MUST return a successful empty inventory.

Persistence corruption, directory/replay identity mismatch, cross-artifact Replay Identity ambiguity, or another inventory integrity failure MUST fail closed and MUST NOT be represented as an empty inventory.

The response ordering MUST remain the deterministic ordering established by the certified inventory service.

Milestone 23 therefore exposes exactly two Genesis runtime HTTP paths:

- `GET /api/runtime/genesis/replays`
- `GET /api/runtime/genesis/replays/:replayId/status`

Both paths are read-only.

Milestone 23 MUST NOT expose POST, PUT, PATCH, or DELETE Genesis routes.

Milestone 23 MUST NOT expose replay discovery, replay start, Evidence admission, resume, recovery, checkpoint mutation, Runner Result mutation, or Knowledge Operations mutation through HTTP.

Milestone 23 MUST NOT modify the certified Replay Status / Inspection Service or Replay Listing / Inventory Read Model semantics.

Milestone 23 MUST NOT add Builder UI or Builder API consumers.

Milestone 23 HTTP integration certification MUST exercise the inventory endpoint through a real ephemeral HTTP server using the actual `registerGenesisReplayInventoryRoute` registration function and isolated `FileGenesisReplayPersistenceStore`.

Integration certification MUST verify:

- an empty persisted Genesis store returns HTTP 200 with an empty inventory;
- multiple persisted replays retain the deterministic Replay Identity ordering established by the inventory service;
- a manifest-only replay remains visible with no fabricated execution state;
- corrupt persisted replay JSON returns an integrity failure rather than HTTP 200 with an empty or partial inventory;
- failed inventory inspection does not rewrite the corrupt persisted artifact.

Milestone 23 integration fixtures MUST remain isolated from operational Genesis and Knowledge storage.

HTTP integration certification MUST NOT create an additional Genesis route or mutation surface.

Genesis Replay Read API Client Contract V1 provides a typed Builder-side client for the two certified Genesis read-only runtime endpoints.

The client contract is transport-only. It MUST NOT create replay state, derive replay inventory independently, execute discovery, start replay, admit Evidence, resume replay, recover replay, or mutate Knowledge Operations.

The client MUST expose exactly two operational read methods:

- list persisted Genesis replays;
- read status for one deterministic Replay Identity.

The client MUST issue GET requests only.

The client MUST reuse the existing Builder runtime base URL and caller-header infrastructure for its production binding.

The pure client implementation MUST support injected base URL, caller-header provider, and fetch implementation so transport behavior can be certified without React, browser workspace state, or a live runtime process.

Replay Identity MUST be validated client-side before the per-replay status request is issued.

A malformed Replay Identity MUST fail before network access.

Runtime error envelopes MUST remain distinguishable through a typed client error carrying the HTTP status and governed runtime error code.

Runtime access denial MUST remain transport-visible. A `403` response carrying `runtime_access_denied` MUST be surfaced as a typed Genesis replay client error with status `403` and code `runtime_access_denied`.

The client MUST NOT translate runtime access denial into a generic network failure, empty inventory, replay not-found, or another Genesis-specific error.

A status error associated with one Replay Identity MAY also retain that Replay Identity in the typed error.

Successful inventory responses MUST be structurally validated before being returned to consumers.

Successful per-replay status responses MUST be structurally validated and MUST carry the same Replay Identity that was requested.

The client MUST NOT reinterpret integrity failures as empty inventory or absent status.

Milestone 24 MAY export the typed read client through the existing Builder `runtimeService` aggregation boundary.

Milestone 24 MUST NOT add React components, workspace state, polling, automatic refresh, navigation, user controls, or any other Builder UI exposure.

Milestone 24 MUST NOT add Genesis mutation client methods.

Genesis Replay Read State Adapter V1 provides a non-UI state boundary over the certified Genesis Replay Read API Client.

The state adapter MUST depend on the typed `GenesisReplayReadClient` interface rather than calling `fetch`, `RUNTIME_API`, runtime routes, or caller-header infrastructure directly.

The adapter MAY maintain:

- persisted replay inventory state;
- inventory loading and loaded state;
- selected Replay Identity;
- selected replay status projection;
- selected replay loading state;
- scoped read error state.

The adapter MUST expose explicit operations for:

- inventory refresh;
- Replay Identity selection and inspection;
- refresh of the currently selected replay;
- clearing selection;
- clearing read errors.

The adapter MUST NOT perform network work merely because it is constructed.

The adapter MUST NOT poll, schedule timers, automatically refresh, navigate, render, or depend on React.

Concurrent read requests MUST be generation-safe.

A stale inventory response MUST NOT overwrite a newer inventory refresh result.

A stale selected-replay response MUST NOT overwrite a newer selection or restore a selection that has been cleared.

A stale failed inventory request MUST NOT overwrite a newer successful inventory result or introduce a stale inventory error.

A stale failed selected-replay request MUST NOT overwrite a newer successful selection or introduce a stale selection error.

Read errors MUST retain their logical scope so inventory failures and selected-replay failures remain distinguishable.

When the underlying typed client provides governed HTTP status and error code information, the state adapter MUST preserve that information rather than reducing it to a generic message.

The adapter MAY expose a framework-neutral subscription mechanism for future UI consumers.

Subscription MUST NOT itself trigger network access.

Milestone 25 MAY export this state adapter through the existing Genesis runtime read binding and `runtimeService`.

Milestone 25 MUST NOT add React components, hooks, workspace state, navigation, polling, automatic refresh, or user controls.

Milestone 25 MUST NOT add Genesis mutation methods or modify runtime-server Genesis endpoints.

Genesis Replay Read View Model V1 provides deterministic, presentation-ready projections over `GenesisReplayReadState`.

The view-model layer MUST be a pure transformation boundary.

It MUST NOT call the Genesis read client, `fetch`, runtime routes, runtime caller-header infrastructure, or the state adapter's imperative operations.

The view model MAY derive:

- inventory row projections;
- short Replay Identity presentation;
- replay lifecycle labels and presentation tone;
- manifest readiness;
- replay progress and completion percentage;
- recovery eligibility presentation;
- Knowledge Manufacturing linkage-health presentation;
- selected replay detail projection;
- scoped error presentation.

The view model MUST NOT fabricate runtime state.

A manifest-only replay MUST remain distinguishable from a replay with execution state.

Missing replay progress MUST NOT be represented as completed execution progress.

Replay completion percentage MUST be derived from certified progress values and MUST be deterministic.

Replay completion percentage presented by the view model MUST remain within the inclusive range `0` through `100`, even if malformed upstream counts escape earlier validation.

Presentation-layer linkage counts MUST NOT claim more linked, ambiguous, or unresolved Evidence than the admitted Evidence population.

The sum of linked, ambiguous, and unresolved Evidence counts exposed by the view model MUST NOT exceed the admitted Evidence count.

Knowledge Manufacturing linkage ambiguity MUST take precedence over otherwise linked status.

An admitted Evidence set with ambiguous manufacturing linkage MUST NOT be represented as healthy.

A partially linked admitted Evidence set MUST remain distinguishable from fully linked Evidence.

A replay with no admitted Evidence MUST remain distinguishable from a replay whose admitted Evidence is fully linked.

Recovery presentation MUST be derived from the certified `recovery` projection and MUST NOT authorize recovery.

Inventory row order MUST preserve the deterministic order supplied by the certified inventory/state layers.

Selected-replay presentation MUST derive from `selectedReplay` rather than independently reconstructing status from an inventory row.

Inventory and selected-replay errors MUST remain logically distinguishable.

Governed runtime error code and HTTP status information MUST remain available in error presentation.

The view-model transformation MUST be deterministic and MUST NOT mutate its input state.

Milestone 26 MAY export the view-model constructor and types through the existing Genesis read binding and `runtimeService`.

Milestone 26 MUST NOT add React components, hooks, workspace state, navigation, polling, subscriptions, timers, network access, or user controls.

Milestone 26 MUST NOT add Genesis mutation methods or modify runtime-server Genesis endpoints.

Genesis Replay Read Controller V1 composes the certified Genesis read client, read-state adapter, and read view model behind one framework-neutral orchestration boundary.

The controller MUST accept a `GenesisReplayReadClient` dependency.

The controller MUST create and own its read-state adapter and MUST derive published snapshots exclusively through `createGenesisReplayReadViewModel`.

The controller MAY expose:

- current presentation snapshot;
- framework-neutral subscription;
- explicit inventory refresh;
- explicit Replay Identity selection;
- explicit selected-replay refresh;
- selection clearing;
- read-error clearing.

Controller construction MUST NOT trigger runtime access.

Controller subscription MUST NOT trigger runtime access.

A subscriber MAY receive the current derived snapshot synchronously when subscribing.

Network work MUST occur only through explicit controller read actions.

The controller MUST NOT call `fetch`, `RUNTIME_API`, caller-header infrastructure, or Genesis runtime routes directly.

The controller MUST NOT duplicate inventory, lifecycle, progress, recovery, linkage-health, or error-presentation derivation.

All such presentation derivation MUST remain owned by the certified read view model.

State concurrency and stale-request protection MUST remain owned by the certified read-state adapter.

The controller MUST NOT weaken or bypass those protections.

Clearing selection through the controller MUST invalidate any pending selected-replay request according to the state-adapter contract.

After controller selection is cleared, a stale successful selected-replay response MUST NOT restore the cleared Replay Identity or selected presentation.

After controller selection is cleared, a stale failed selected-replay response MUST NOT introduce a selection error or restore loading state.

Controller composition MUST preserve the state adapter's generation invalidation semantics unchanged.

Controller errors MUST retain the typed runtime status/error information preserved by the client and state layers.

The production Genesis read binding MAY instantiate one controller over the existing production Genesis read client.

Creating that production controller MUST remain side-effect free until an explicit read action is invoked.

Milestone 27 MUST NOT add polling, scheduled refresh, timers, React components, React hooks, workspace state, navigation, or user controls.

Milestone 27 MUST NOT add Genesis mutation operations or modify runtime-server Genesis endpoints.

Genesis Replay React Adapter V1 provides the first React-specific bridge over the certified framework-neutral Genesis Replay Read Controller.

The React adapter MUST consume `GenesisReplayReadController` and MUST NOT consume the raw runtime client, runtime endpoints, runtime caller-header infrastructure, or Genesis persistence directly.

The adapter MUST use React's external-store subscription contract rather than duplicating controller state into independent React state.

Because the framework-neutral controller derives view-model snapshots on demand, the React adapter MUST maintain a cached snapshot whose object identity remains stable until the controller publishes a state change.

The React adapter MUST NOT pass an uncached controller `getSnapshot` projection directly to `useSyncExternalStore`.

React adapter construction MUST NOT subscribe to the controller.

React adapter construction MUST NOT trigger runtime access.

The first active React subscriber MAY lazily establish one controller subscription.

Multiple React subscribers MUST share that controller subscription.

When the final React subscriber unsubscribes, the adapter MUST release its controller subscription.

A later React subscriber MAY re-establish the controller subscription.

While no React subscribers are attached, the cached React snapshot MAY remain unchanged even if controller state changes.

When a later subscriber re-establishes the controller subscription, the adapter MUST synchronously reconcile its cached snapshot from the controller's current subscription delivery before the subscription operation returns.

That reconnection reconciliation MUST NOT itself be emitted as a synthetic React change notification.

After reconnection, subsequent genuine controller publications MUST notify active React subscribers normally from the reconciled snapshot baseline.

The controller's synchronous initial subscription delivery MUST NOT be treated as a synthetic state change requiring an additional React notification.

Controller publications MUST replace the cached React snapshot before subscribers are notified.

The server snapshot and client snapshot exposed to React MUST derive from the same cached certified view model.

The React adapter MAY expose explicit controller read actions:

- refresh inventory;
- select Replay Identity;
- refresh selected replay;
- clear selection;
- clear read error.

The adapter MUST NOT add business logic, lifecycle derivation, progress derivation, recovery derivation, linkage derivation, concurrency logic, or error reinterpretation.

Those semantics remain owned by the certified controller and its underlying state/view-model layers.

The React adapter MUST NOT automatically invoke any read action when created, subscribed, or imported.

Milestone 28 MAY instantiate one production React adapter over the production Genesis read controller.

That production adapter MUST remain side-effect free until a component explicitly invokes a read action.

Milestone 28 MUST NOT add polling, timers, automatic refresh, workspace state, navigation, rendered workspace components, or user controls.

Milestone 28 MUST NOT add Genesis mutation operations or modify runtime-server Genesis endpoints.

Genesis Replay Read Hook Contract V1 provides the first application-consumable React hook for the certified Genesis replay read stack.

The production hook MUST bind the existing generic `useGenesisReplayRead` React adapter hook to the existing singleton `genesisReplayReactAdapter`.

The production hook MUST NOT create a second runtime client, read-state adapter, controller, React adapter, or external-store implementation.

The production hook MUST NOT call `useSyncExternalStore` directly.

External-store semantics remain owned by Genesis Replay React Adapter V1.

The production hook MUST expose the certified React binding unchanged:

- presentation snapshot;
- explicit inventory refresh;
- explicit Replay Identity selection;
- explicit selected-replay refresh;
- explicit selection clearing;
- explicit read-error clearing.

Hook invocation MUST NOT automatically refresh inventory.

Hook invocation MUST NOT automatically inspect a replay.

Hook invocation during server rendering MUST NOT perform runtime network access.

The initial server-rendered snapshot MUST come from the certified React adapter server snapshot.

The hook MUST NOT introduce local React state for Genesis replay data.

The hook MUST NOT reinterpret lifecycle, progress, recovery, linkage, loading, or error state.

Those semantics remain owned by the previously certified read stack.

Milestone 29 MUST NOT add polling, timers, effects that trigger runtime access, workspace state, navigation, rendered workspace UI, or user controls.

Milestone 29 MUST NOT add Genesis mutation operations or modify runtime-server Genesis endpoints.

Genesis Replay Read Workspace Shell V1 provides the first rendered read-only presentation surface over the certified production Genesis replay hook.

The workspace shell MUST consume `useGenesisReplayRead`.

The workspace shell MUST NOT create or consume a lower-level Genesis runtime client, state adapter, controller, or external-store implementation directly.

The workspace shell MUST use the existing Lumina workspace composition primitives rather than introducing a Genesis-specific page framework.

Workspace rendering MUST NOT trigger inventory loading.

Workspace rendering MUST NOT trigger selected-replay inspection.

The initial shell MUST visibly distinguish inventory that has not yet been loaded from an authoritative empty persisted inventory.

Milestone 30 certification MUST render controlled authoritative states for:

- initial inventory not loaded;
- loaded empty persisted inventory;
- loaded non-empty persisted inventory;
- selected replay inspection;
- scoped Genesis read failure.

A loaded empty inventory MUST NOT fall back to the not-yet-loaded presentation.

A loaded non-empty inventory MUST surface only presentation values supplied by the certified Genesis replay view model.

A selected replay inspection MUST surface the certified selected replay projection and MUST NOT independently reconstruct replay state from the inventory row.

A scoped read error MUST remain visible as a read-integrity condition without erasing the distinction between inventory and selection state.

Inventory reads MUST occur only after an explicit user refresh/load action.

Per-replay status reads MUST occur only after explicit Replay Identity selection or explicit selected-replay refresh.

The inventory surface MAY expose certified presentation fields already provided by the Genesis view model, including lifecycle, progress, recovery eligibility, and Knowledge Manufacturing linkage health.

The workspace MUST NOT independently derive Replay Identity, lifecycle semantics, recovery eligibility, progress rules, or linkage-health semantics.

The inspection surface MUST derive from the certified selected replay view model.

The workspace MUST preserve scoped read failures and MAY expose explicit error clearing.

Recovery eligibility displayed by the workspace is observational only and MUST NOT be represented as authorization to execute recovery.

The workspace MUST NOT expose start, resume, recover, delete, Evidence admission, replay execution, checkpoint mutation, or Knowledge mutation controls.

Milestone 30 creates the workspace shell component only.

Milestone 30 MUST NOT add the workspace to the Builder `View` union, Router, Dashboard, navigation, command palette, or another application entry point.

Routing and navigation exposure require a separate certified milestone.

Milestone 30 MUST NOT add polling, timers, automatic refresh, or effects that perform Genesis runtime access.

Milestone 30 MUST NOT modify runtime-server Genesis endpoints or certified lower Genesis read layers.

# Genesis Cross-Source Correlation and Evolution Episode Contract

## Governing Principle

Genesis historical reconstruction SHALL follow:

**Separate evidence. Correlated history. Governed conclusions.**

Cross-source correlation MUST NOT merge independently sourced evidence.

Correlation MUST NOT itself grant canonical authority.

Historical Replay MUST continue with repository-native sources when external conversation sources are unavailable.

Conversation absence MUST remain explicit rather than being replaced by guessed rationale or Git-derived conversation substitutes.

## Four-Layer Historical Model

Genesis distinguishes four layers:

1. **Source Evidence** — independently provenance-preserving source observations.
2. **Historical Events** — deterministic normalized occurrences backed by source references.
3. **Evolution Episodes** — governed correlation containers relating historical events around one concern, capability, decision, defect, architecture, implementation, or validation sequence.
4. **Governed Knowledge** — existing Knowledge Operations lifecycle outputs produced only after reconstruction and governed extraction.

Evolution Episodes are not Canonical Knowledge.

Historical reconstruction does not perform canonical promotion.

## Source Independence

Conversation Evidence, Documentation Evidence, Git Evidence, Runtime Evidence, Test Evidence, Mission Evidence, Certification Evidence, and Human Validation Evidence MUST retain independently traceable source identities.

An Evolution Episode MUST reference source evidence rather than collapsing source artifacts into the Episode record.

Genesis MUST remain capable of answering independently:

- what a human requested;
- what engineering implemented;
- what Git recorded;
- what Runtime executed;
- what tests proved;
- what visual validation accepted or rejected;
- what governance approved.

## Historical Events

Historical Events MUST have deterministic identity.

The same unchanged source observation replayed repeatedly MUST resolve to the same Historical Event identity.

A changed source observation MUST preserve revision or lineage rather than silently replacing previous history.

Historical Event kinds MAY include requirement statements, architecture proposals, approvals, rejections, delegated tasks, commits, Runtime observations, builds, tests, visual validations, corrections, replacements, document amendments, supersession, and certification.

## Historical Relationships

Genesis relationships MAY include:

`requested`,
`clarified`,
`proposed`,
`approved`,
`rejected`,
`corrected`,
`delegated`,
`implemented_by`,
`modified_by`,
`validated_by`,
`failed_validation`,
`replaced_by`,
`superseded_by`,
`certified_by`,
`contradicted_by`,
`confirmed_by`,
`derived_from`,
`related_to`,
and non-causal chronological ordering.

A relationship MUST retain Correlation Evidence explaining why the relationship exists.

Relationship identity MUST be deterministic.

## Correlation Confidence

Cross-source correlation MUST classify confidence as one of:

- `explicit`;
- `strong`;
- `probable`;
- `possible`;
- `unresolved`.

`explicit` requires direct evidence such as a source naming a commit, document, issue, milestone, file, task, certification, or other stable artifact.

`strong` requires convergent evidence that strongly identifies a relationship.

`probable` indicates evidence supports the relationship without conclusively establishing it.

`possible` indicates temporal or topical similarity without sufficient historical proof.

`unresolved` indicates conflict or insufficient evidence prevents a reliable conclusion.

`possible` and `unresolved` relationships MUST NOT be presented as historical fact.

## Chronology and Causality

Chronology is not causality.

Genesis MAY assert `occurred_before` from reliable temporal evidence.

Genesis MUST NOT infer `caused` solely because one event precedes another.

Causal relationships require affirmative supporting evidence and sufficient confidence.

A causal relationship MUST have `explicit` or `strong` correlation confidence.

`probable`, `possible`, and `unresolved` correlations MUST NOT be represented as causal relationships.

Relationship confidence and the confidence recorded by its Correlation Evidence MUST agree.

## Evolution Episodes

An Evolution Episode is a deterministic correlation container for related historical events and source evidence.

Episode identity MUST remain stable across replay when the Episode represents the same historical evolution.

Episode membership enrichment MUST produce a new Episode revision while preserving the Episode identity.

Every revision after the first MUST be capable of identifying the immediately preceding Episode revision.

Replaying an unchanged Episode revision MUST resolve to the same revision identity and MUST NOT create a duplicate revision.

When previously separate historical threads are determined to describe one combined historical evolution, a merge MUST create a distinct deterministic Episode identity and MUST retain every merged source Episode identity in lineage.

When one Episode is later determined to contain distinct historical evolutions, each split Episode MUST receive its own deterministic Episode identity and MUST retain the source Episode identity through `splitFrom` lineage.

Episode supersession MUST preserve the superseded Episode as inspectable historical state and MUST identify the superseded Episode from the replacement Episode lineage.

Conversation enrichment of an existing repository-native Episode MUST preserve the Episode identity where the underlying historical evolution is unchanged, while producing a new revision identity and retaining the preceding revision lineage.

Episode lineage MUST support merge, split, supersession, and revision without erasing prior Episode state.

Replay MUST NOT create duplicate Evolution Episodes or Episode revisions for unchanged defining history.

Not every source artifact must become an Evolution Episode.

Not every Evolution Episode must become Canonical Knowledge.

## Episode Lifecycle

Supported reconstruction lifecycle states are:

- `candidate`;
- `correlating`;
- `correlated`;
- `conflicted`;
- `incomplete`;
- `validated`;
- `superseded`;
- `archived`.

Lifecycle status reflects reconstruction state only.

It MUST NOT masquerade as canonical approval, educational eligibility, or implementation correctness.

## Failed Paths

Failed and superseded paths are first-class historical records.

Genesis MUST preserve failed attempts after replacements are introduced.

A failed implementation that was followed by correction and replacement remains inspectable as historical evidence.

Historical failed approaches MUST NOT be taught as current practice merely because they are educationally useful.

Educational projection MAY later mark such material as historical lessons or **DO NOT APPLY AS CURRENT PRACTICE** under Learning governance.

## Temporal Authority

Genesis MUST distinguish historical authority from current authority.

Historical representations MAY identify material as historically proposed, rejected, implemented, validated, observed, or authoritative.

Current representations MAY identify material as currently authoritative, implemented, superseded, retired, not applicable, or unknown.

Superseded historical authority remains inspectable.

Current authority MUST NOT be inferred solely from chronology.

Documentation authority continues to be governed by Constitutional Documentation Governance.

## Conflicting Evidence

Genesis MUST preserve disagreement between sources.

It MUST NOT automatically choose the earliest statement, latest statement, Git state, Runtime state, or conversation statement as universally authoritative.

Conflict and resolution sequences remain part of the Episode history.

## Human Validation Evidence

Human validation statements such as `green`, `red`, `didn't work`, `approved`, `proceed`, and visual certification are historically meaningful only with retained context.

A validation statement SHOULD be correlated with the artifact, revision, milestone, or implementation it evaluated where evidence supports the relationship.

Bare validation text without recoverable context MUST NOT be elevated into institutional knowledge.

## Documentation Correlation

Documentation MAY participate through relationships including `governed_by`, `specified_by`, `amended_by`, `reconciled_by`, `superseded_by`, and `certified_by` where compatible governed relationship models exist.

Document authority derives from Constitutional Documentation Governance, not document timestamp or version ordering alone.

## Git Correlation

Git proves repository state and commit history.

Git correlation SHOULD preserve commit identity, parentage, timestamp, changed files, branch or tag context where relevant, commit message, and source revision.

Git alone does not prove architectural correctness, human approval, visual certification, educational eligibility, or current authority.

## Runtime and Test Correlation

Runtime and Test Evidence remain distinct source classes.

Build success MUST NOT be treated as UI certification.

Test success MUST NOT be treated as constitutional approval.

Runtime evidence MAY establish execution facts but MUST NOT independently grant canonical authority.

## Certification Correlation

Certification Evidence SHOULD identify the exact implementation, revision, package, workspace state, or artifact it certified.

Certification without recoverable certified-state identity remains historically incomplete.

## External Conversation Source Boundary

Historical conversations are external sources and MUST NOT be searched for in Git.

Commit messages MUST NOT substitute for conversations.

Until an approved acquisition mechanism is available, Genesis SHALL represent unavailable conversation coverage as:

**EXTERNAL SOURCE — NOT YET INGESTED**

and Episode-level missing context as:

**EXTERNAL CONTEXT PENDING**

External conversation absence MUST NOT block repository-native Historical Replay.

## Future Conversation Acquisition

Conversation acquisition and Conversation compilation are separate responsibilities.

Future acquisition MUST preserve, where available:

- conversation identity;
- message identity;
- project or conversation association;
- timestamp;
- speaker or role;
- ordering;
- source reference;
- acquisition/import event;
- integrity information.

The conceptual boundary is:

Conversation Source
→ Conversation Acquisition
→ Conversation Evidence
→ Conversation Compiler

Conversation enrichment MUST preserve existing repository provenance.

When enrichment concerns the same historical evolution, Episode identity SHOULD remain stable while Episode revision changes.

## Genesis Corpus Projection

The Genesis Corpus SHALL eventually expose both **Source History** and **Evolution History**.

The projection may include:

- Sources;
- Historical Events;
- Evolution Episodes;
- Decisions;
- Failed Paths;
- Supersession;
- Conflicts;
- Lessons;
- Educationally Eligible Knowledge.

Source evidence, reconstruction state, governed knowledge status, and educational eligibility MUST remain distinguishable.

## Educational Significance

Evolution Episodes exist partly to preserve historical rationale for future Chief Agent education.

A governed educational projection SHOULD eventually support:

current architecture
+
historical rationale
+
failed alternatives
+
corrections
+
governance boundaries
+
validation evidence
+
lessons learned.

Educational projection remains subject to CA-005 and the Knowledge Constitution.

Genesis itself MUST NOT activate or educate the Chief Agent.

## Persistence

Cross-source correlation state MUST use the Genesis runtime persistence boundary.

Production correlation data belongs under runtime-managed Genesis storage, not source-controlled directories.

Persistence MUST support an injected root for isolated tests.

Correlation persistence MUST remain deterministic, replay-safe, recoverable, auditable, provenance-preserving, and isolated from production Knowledge stores during tests.

## Milestone 31 Foundation Boundary

Milestone 31 establishes only the minimum durable cross-source reconstruction foundation:

- `HistoricalSourceReference`;
- `HistoricalEvent`;
- `HistoricalRelationship`;
- `EvolutionEpisode`;
- `CorrelationEvidence`;
- `CorrelationConfidence`;
- `TemporalAuthority`;
- replay-safe deterministic identity;
- correlation persistence.

Milestone 31 MUST NOT:

- perform full Day-0 replay;
- ingest external conversations;
- invent unavailable conversation rationale;
- alter the certified Genesis read workspace;
- expose a new Builder route;
- activate Chief Agent education;
- build the Executive Office;
- bypass Knowledge Operations;
- perform canonical promotion.

After Milestone 31 certification, repository-native Historical Replay MAY continue toward Genesis Corpus projection while preserving future conversation enrichment.

# Genesis Corpus Domain / Read Model V1

## Purpose

Genesis Corpus Domain / Read Model V1 establishes the first governed read-only projection that presents existing Historical Replay state and cross-source reconstruction state as one inspectable Genesis Corpus.

The Genesis Corpus is not a directory of replayed files.

The Genesis Corpus projection MUST preserve the distinction between:

- Source History;
- Historical Events;
- Historical Relationships;
- Evolution Episodes;
- Historical Replay execution;
- governed Evidence admission;
- Knowledge Manufacturing correlation;
- Knowledge Package correlation;
- Canonical Knowledge correlation;
- Organizational Memory adaptation;
- educational eligibility.

## Projection Boundary

Milestone 32 is a derived read model.

It MUST NOT create a second persistence authority for replay, Evidence, Knowledge Packages, Canonical Knowledge, Organizational Memory, or education.

The projection MUST consume existing certified replay/read state and Milestone 31 historical-correlation state.

Projection construction MUST NOT mutate those sources.

Projection identity MUST be deterministic for unchanged input state.

## Source History

The corpus MUST expose independently provenance-preserving source references and revisions.

Each source projection MUST retain:

- stable source-reference identity;
- source-revision identity;
- source class;
- Evidence type;
- external-source status;
- acquisition status;
- provenance;
- related Historical Event identities;
- related Evolution Episode identities.

Multiple revisions of one historical source MUST remain distinguishable.

## Evolution History

The corpus MUST expose Historical Events, Historical Relationships, and Evolution Episodes without collapsing them into source evidence or governed knowledge.

Historical Events MUST remain chronologically inspectable.

Chronological ordering MUST NOT itself produce causality.

Relationship confidence and causal semantics remain governed by Milestone 31.

## Replay State

Historical Replay execution state remains distinct from Genesis Corpus projection state.

A replay marked `COMPLETE` does not mean the Genesis Corpus is constitutionally complete.

Replay completion proves only the state defined by the existing replay contract for that replay.

## Governed Knowledge Lifecycle

The Genesis Corpus read model MAY expose correlations already proved by production state for:

- admitted Evidence;
- Knowledge Manufacturing;
- Knowledge Packages;
- Canonical Knowledge.

The projection MUST NOT infer a downstream governed state merely because an upstream state exists.

In particular:

**Canonical Knowledge does not imply Organizational Memory adaptation.**

**Organizational Memory adaptation does not imply educational eligibility.**

Until those governed correlations are implemented and certified, their Corpus projection state MUST remain explicitly `not-correlated` or equivalent rather than fabricated as zero, complete, eligible, or successful.

## External Context

External context gaps remain first-class Genesis Corpus state.

Conversation Evidence classified as `EXTERNAL SOURCE — NOT YET INGESTED` MUST remain visible.

Evolution Episodes marked `EXTERNAL CONTEXT PENDING` MUST remain visible.

External-context gaps MUST NOT prevent repository-native Corpus projection.

## Corpus Identity

The read model MUST have deterministic projection identity derived from the certified identities and governed states it represents.

Unchanged replay state, source revisions, Historical Events, Historical Relationships, and Episode revisions MUST produce the same Corpus projection identity.

Equivalent input collection ordering MUST NOT change Corpus projection identity.

A material Episode revision MUST change Corpus projection identity.

A material governed replay-state change that is represented by the Corpus projection MUST change Corpus projection identity.

A material revision to those inputs MUST be capable of producing a new projection identity.

The Corpus projection identity is not Canonical Knowledge identity and grants no governance authority.

## Milestone 32 Stop Boundary

Milestone 32 MUST NOT:

- execute full Historical Replay;
- ingest conversations;
- manufacture Historical Events from timestamp proximity;
- infer causality;
- alter Genesis replay execution;
- alter Evidence admission;
- perform canonical promotion;
- infer Organizational Memory adaptation;
- infer educational eligibility;
- activate Chief Agent education;
- redesign the Genesis workspace;
- add Builder routing;
- build the Executive Office.

Milestone 32 establishes the first truthful Genesis Corpus domain/read model only.

Temporal chronology enrichment, documentation authority enrichment, full Knowledge Operations lifecycle correlation, readiness computation, external conversation acquisition, and operational workspace expansion remain subsequent milestones.

# Genesis Temporal Chronology Projection V1

## Purpose

Genesis Temporal Chronology Projection V1 establishes a deterministic chronological read projection over the certified Genesis Corpus.

Chronology exists to answer:

- what happened;
- when it happened;
- which source evidence supports the event;
- which Evolution Episode contains it;
- what authority applied historically;
- what authority applies now;
- what explicit historical relationships are known;
- where chronology remains incomplete, conflicted, or externally under-contextualized.

Chronology does not independently establish causality.

## Ordering

Historical Events MUST be ordered by their explicit `occurredAt` value.

Events sharing the same timestamp MUST use deterministic Historical Event identity as the tie-breaker.

Tie-break ordering is a read-model ordering rule only.

Equal timestamp ordering MUST NOT imply:

- causality;
- approval;
- supersession;
- implementation dependency;
- validation;
- replacement;
- authority.

Those claims require existing evidence-backed Historical Relationships.

## Provenance

Every chronology entry MUST retain its Historical Event identity.

Every chronology entry MUST retain source-reference and source-revision identities from the Historical Event.

Where an event belongs to an Evolution Episode, the chronology MUST expose the Episode identity without collapsing the Event into the Episode.

Chronology MUST NOT merge independent Source Evidence.

## Relationship Projection

The chronology MAY expose incoming and outgoing Historical Relationships already certified by Milestone 31.

The chronology MUST NOT manufacture new relationships merely because two events are adjacent in time.

Chronological predecessor/successor projections MUST derive only from explicit `occurred_before` relationships.

A `superseded_by`, `replaced_by`, `validated_by`, `implemented_by`, or other non-chronological relationship MUST remain that relationship type and MUST NOT be converted into `occurred_before`.

## Temporal Authority

Chronology MUST preserve historical authority separately from current authority.

A historically authoritative event MAY be currently superseded or retired.

A historically rejected proposal MAY remain historically important.

A currently authoritative state MUST NOT erase superseded history.

Chronology MUST NOT infer current authority from event recency.

Documentation authority remains governed by Constitutional Documentation Governance.

## Failed and Superseded Paths

Events associated with failed validation, rejected decisions, corrections, replacements, and superseded implementations MUST remain chronologically inspectable.

Chronology MUST NOT hide a failed or superseded event merely because a later accepted event exists.

Historical presence does not make a failed path current practice.

## Chronology Coverage

Temporal chronology coverage is not Genesis Corpus completion.

Coverage MAY expose:

- total Historical Events;
- earliest known Event timestamp;
- latest known Event timestamp;
- equal-timestamp groups;
- source revisions with no Historical Event;
- Evolution Episodes with external context pending;
- conflicted Episodes;
- unresolved Historical Relationships.

Chronology coverage MUST remain incomplete while known chronology gaps, conflicts, unresolved correlations, or required external context remain.

A complete chronology projection MUST NOT be represented as educational readiness.

A complete chronology projection MUST NOT be represented as canonical approval.

## Projection Identity

Chronology projection identity MUST be deterministic.

Equivalent input collection ordering MUST NOT change chronology projection identity.

A material change to an Event's represented temporal authority MUST change chronology projection identity.

A current-authority change MUST NOT alter the historical chronology position of an unchanged Historical Event.

A superseded Historical Event MUST retain its original chronological position after a later authoritative replacement is introduced.

Equivalent reordering of Corpus source, replay, Event, relationship, and Episode collections MUST NOT alter chronology positions or chronology projection identity.

Historical chronology position MUST derive only from Event historical time plus deterministic Event identity tie-breaking.

Current authority, current implementation status, canonical state, or educational state MUST NOT participate in chronology ordering.

A material change to represented Event, relationship, Episode, or chronology-coverage state MUST be capable of changing chronology projection identity.

The chronology projection identity grants no canonical or educational authority.

## Milestone 33 Stop Boundary

Milestone 33 MUST NOT:

- execute Historical Replay;
- ingest external conversations;
- create Historical Events;
- infer causality from chronology;
- infer current authority from recency;
- alter source evidence;
- alter Evolution Episode identity;
- perform Knowledge Operations mutation;
- infer Organizational Memory adaptation;
- infer educational eligibility;
- redesign or route the Genesis workspace;
- activate Chief Agent education;
- build the Executive Office.

Milestone 33 establishes Temporal Chronology Projection V1 only.

Documentation governance enrichment remains the next reconstruction concern.

# Genesis Documentation Governance Enrichment V1

## Purpose

Genesis Documentation Governance Enrichment V1 projects repository documentation through the existing Constitutional Documentation Governance model.

This milestone does not create a competing document-authority hierarchy.

Genesis MUST preserve declared documentation governance metadata and assess it according to the repository's existing authority rules.

## Governing Rule

Document authority MUST NOT be inferred from chronology, path prominence, filename, version number, or recency alone.

Document class and document authority are separate concepts.

A file may be classified as architecture while its authority remains draft, proposed, superseded, historical, or unresolved.

## Governance Metadata

Where explicitly declared, Genesis MUST preserve:

- authority class;
- approval state;
- owner;
- scope;
- version;
- effective-from declaration;
- effective-to declaration.

Genesis MUST NOT fabricate missing effective periods from Git timestamps, filesystem timestamps, discovery time, or Event chronology.

A missing effective period remains a governance gap.

## Governance Classes

Genesis MAY project documentation into the existing repository governance concepts including:

- Canon;
- Constitution;
- Blueprint;
- approved decision records;
- Architecture;
- Reconciliation;
- Specification;
- Operating Model;
- Governance;
- Validation;
- Certification;
- Roadmap;
- RFC;
- Audit;
- Research;
- Historical;
- Archive.

Classification does not itself grant authority.

## Authority Effects

Genesis MUST distinguish governing documentation from:

- evidentiary documentation;
- planning documentation;
- proposals;
- historical evidence;
- explicitly non-governing documentation;
- unresolved authority.

Validation and Certification prove their scoped validation/certification state but do not independently establish architecture.

Audit reports findings but does not independently establish architecture.

Roadmaps express intended execution and do not prove implementation.

RFCs and Research do not govern until accepted through the applicable governance process.

## Approval State

Canonical, Authoritative, Approved, Active, and Frozen states MAY establish governing status where the document class and scope permit.

Draft, Proposed, and Review documents MUST NOT be represented as current governing authority.

Superseded, Historical, and Archived documents remain inspectable historical evidence and MUST NOT silently regain current authority.

`Complete` alone MUST NOT be interpreted as constitutional or architectural authority.

## Supersession

Explicit source supersession MUST remain attached to the documentation governance projection.

A superseded document remains historically inspectable.

Genesis MUST NOT determine supersession solely because another document is newer or has a larger version number.

## Historical Versus Current Authority

Documentation governance MUST distinguish historical authority state from current authority state.

Where current metadata proves only that a document is now superseded or archived, Genesis MUST NOT invent the document's former governing state.

Unknown historical authority remains unresolved/historical rather than fabricated.

## Determinism

Documentation governance projection identity MUST be deterministic.

Equivalent input ordering MUST NOT change projection identity.

A material governance metadata change MUST be capable of changing projection identity.

A governance metadata revision MUST NOT change Historical Source identity when the underlying stable source identity is unchanged.

Approval-state, authority-scope, declared effective-period, or other represented governance metadata revisions MUST be capable of producing a new documentation-governance projection identity while preserving the Historical Source identity.

A newer historical timestamp MUST NOT restore governing authority to a document explicitly marked superseded, historical, or archived.

A larger document version number MUST NOT restore governing authority to a document explicitly marked superseded, historical, or archived.

Recency and version ordering MUST NOT override explicit approval state, supersession, constitutional precedence, or authority scope.

## Milestone 34 Stop Boundary

Milestone 34 MUST NOT:

- execute Historical Replay;
- infer document authority from recency;
- create Canonical Knowledge;
- perform canonical promotion;
- modify Organizational Memory;
- infer educational eligibility;
- ingest external conversations;
- redesign Genesis UI;
- activate Chief Agent education;
- build the Executive Office.

Milestone 34 establishes documentation-governance enrichment only.

Knowledge Operations lifecycle correlation remains the next Genesis reconstruction concern.

# Genesis Knowledge Operations Lifecycle Correlation V1

## Purpose

Genesis Knowledge Operations Lifecycle Correlation V1 provides a read-only correlation between admitted Genesis Evidence and the existing production Knowledge Operations lifecycle.

Genesis does not receive a separate Knowledge Constitution.

The authoritative lifecycle remains:

Historical Source
→ Replay
→ Evidence
→ Knowledge Manufacturing Run
→ Knowledge IR
→ Validation
→ Knowledge Package
→ Canonical Review
→ Canonical Knowledge
→ Organizational Memory adaptation where governed.

## Evidence Correlation

Genesis MUST correlate admitted Evidence to Knowledge Manufacturing Runs by stable Evidence identity.

One matching manufacturing run MAY be represented as correlated.

Multiple matching runs MUST be represented as ambiguous.

Genesis MUST NOT arbitrarily choose one of multiple manufacturing runs.

Admitted Evidence with no manufacturing run MUST remain visible as not correlated.

## Manufacturing Lifecycle

Knowledge Manufacturing stage state MUST derive from the existing manufacturing run and stage history.

Genesis MUST preserve the distinction between:

- Knowledge IR;
- Validation;
- Knowledge Package Assembly;
- Canonical Review;
- Canonical Knowledge.

A later stage MUST NOT erase earlier lifecycle history.

Failed and blocked stages remain inspectable.

## Review Versus Promotion

Canonical Review is not Canonical Knowledge.

An item awaiting human review MUST NOT be represented as canonical.

Review approval alone MUST NOT fabricate a Canonical Knowledge identity.

Canonical Knowledge identity MUST come from the existing manufacturing/canonical lifecycle.

## Organizational Memory

Genesis MAY correlate Canonical Knowledge to Organizational Memory only through existing governed identity, including `canonicalItemId`.

Canonical Knowledge does not imply Organizational Memory adaptation.

Absence of a matching Organizational Memory record MUST remain `not-correlated`.

Multiple matching memory records MUST remain ambiguous unless another governed contract resolves the ambiguity.

Adaptation validation MUST be preserved independently from canonical identity.

## Educational Boundary

Organizational Memory correlation does not imply educational eligibility.

Adaptation validation does not imply educational eligibility.

Milestone 35 MUST report educational eligibility as not evaluated.

CA-005 governs later educational eligibility and Day-0 education.

## Projection Identity

Knowledge lifecycle correlation projection identity MUST be deterministic.

Equivalent manufacturing-run and Organizational Memory input ordering MUST NOT change projection identity.

A material represented lifecycle, canonical, or memory-adaptation change MUST be capable of changing projection identity.

A change to Organizational Memory adaptation validation MUST be capable of changing lifecycle projection identity without changing the correlated Canonical Knowledge identity.

An ambiguous manufacturing correlation MUST NOT expose package identity, Canonical Knowledge identity, downstream lifecycle stage state, or Organizational Memory state from any candidate run.

Ambiguous Organizational Memory correlation MUST NOT be represented as validated adaptation unless every correlated record independently proves validated adaptation; mixed adaptation evidence MUST remain non-validated at the aggregate correlation boundary.

Canonical Knowledge identity, Organizational Memory adaptation, adaptation validation, and educational eligibility are separate governed facts.

A downstream fact MUST NOT be inferred solely from the presence of an upstream fact.

## Read-Only Boundary

The lifecycle correlation projection MUST NOT:

- create or alter Evidence;
- create or advance manufacturing runs;
- assemble Knowledge Packages;
- approve Canonical Review;
- promote Canonical Knowledge;
- adapt Organizational Memory;
- evaluate educational eligibility.

It observes certified production state only.

## Milestone 35 Stop Boundary

Milestone 35 MUST NOT:

- execute Historical Replay;
- modify Knowledge Operations;
- perform canonical promotion;
- perform memory adaptation;
- evaluate educational eligibility;
- ingest conversations;
- redesign Genesis UI;
- activate Chief Agent education;
- build the Executive Office.

Milestone 35 establishes Knowledge Operations Lifecycle Correlation V1 only.

Genesis readiness and completion computation remains the next reconstruction concern.

# Genesis Readiness / Completion Model V1

Genesis readiness is a deterministic, read-only projection over the certified Genesis Corpus, Temporal Chronology, Documentation Governance, and Knowledge Operations lifecycle projections.

Genesis readiness MUST NOT be reduced to a synthetic completion percentage.

Required historical source classes MUST come from an explicit readiness policy.

A missing policy-required source class MUST remain visible.

Historical conversation absence MUST remain visible when conversation is required by policy.

Repository-native reconstruction MAY continue while external context remains pending, but full Genesis completion MUST remain incomplete.

Replay readiness MUST distinguish completed, running, pending, blocked, and failed replay state.

The current certified Genesis Corpus does not expose an exact source-level replayed count. Milestone 36 MUST therefore expose exact `sourcesReplayed` as unavailable rather than infer it from manifest size, Evidence admission, or replay completion.

Readiness MUST preserve separate Knowledge lifecycle states for Evidence admission, Manufacturing correlation, Knowledge IR, Validation, Knowledge Package Assembly, Canonical Review, Canonical Knowledge, Organizational Memory correlation, and adaptation validation.

Chronology gaps, conflicted Evolution Episodes, external context pending, and unresolved Historical Relationships remain readiness gaps.

Documentation authority gaps, missing authority scope, and missing declared effective period remain readiness gaps.

Educational eligibility MUST remain `not-evaluated`.

Canonical Knowledge, Organizational Memory correlation, and adaptation validation MUST NOT be treated as educational eligibility.

Milestone 36 MUST NOT report full Genesis readiness while educational eligibility remains unevaluated.

Overall readiness MAY be `blocked`, `incomplete`, or `ready`.

Failed or blocked Historical Replay and failed or blocked Knowledge Manufacturing MUST produce `blocked`.

Known gaps MUST produce `incomplete`.

Readiness blocker ordering MUST be deterministic.

Equivalent readiness-policy source-class ordering MUST NOT change readiness projection identity.

Changing readiness policy MUST NOT mutate, revise, or reinterpret existing Historical Source identity or source history.

Clearing a chronology, correlation, documentation-authority, Replay, or Knowledge lifecycle gap MUST change the readiness projection when that represented readiness state changes.

An otherwise complete repository-native reconstruction MUST NOT report `ready` while exact required replay coverage remains unavailable.

An otherwise complete repository-native reconstruction MUST NOT report `ready` while CA-005 educational eligibility remains unevaluated.

When conversation is required by the explicit readiness policy, an otherwise complete repository-native reconstruction MUST NOT report `ready` while governed conversation coverage remains unavailable.

Readiness blockers MUST use deterministic canonical ordering.

Milestone 36 MUST NOT execute Historical Replay, admit Evidence, mutate Knowledge Operations, perform canonical promotion, adapt Organizational Memory, evaluate educational eligibility, ingest conversations, redesign Genesis UI, activate the Chief Agent, or build the Executive Office.

Milestone 36 establishes Genesis Readiness / Completion Model V1 only.

# Genesis Historical Conversation Source Boundary V1

## Certified Repository Classification

At Milestone 37 the repository-supported historical conversation state is:

`SOURCE ACCESS BLOCKED`

This classification means:

- a governed Conversation Compiler exists;
- the Conversation Compiler is registered in the Knowledge Preservation Platform;
- conversation Evidence has a governed compiler path into Knowledge IR;
- no governed historical-conversation acquisition/source adapter currently exists.

The compiler is not the blocker.

Historical conversation source access is the blocker.

## Acquisition and Compilation Separation

Conversation acquisition and Conversation compilation are separate responsibilities.

The required future lifecycle is:

Conversation Source
→ Conversation Acquisition
→ Conversation Evidence
→ Conversation Compiler
→ Knowledge IR
→ existing Knowledge Operations governance.

Genesis MUST NOT move external acquisition logic into the Conversation Compiler.

Genesis MUST NOT fabricate Conversation Evidence from Git history.

Git commit messages, issue comments, documentation, or Runtime history MUST NOT substitute for unavailable historical conversations.

## Future Acquisition Contract

Any future governed conversation acquisition mechanism MUST preserve, where available and applicable:

- conversation identity;
- message identity;
- project/conversation association;
- timestamp;
- speaker or role;
- message ordering;
- source reference;
- acquisition event;
- integrity information.

Acquisition MUST preserve source provenance before compilation.

## Current External Source State

Unavailable historical conversations MUST remain representable as:

`EXTERNAL SOURCE — NOT YET INGESTED`

Historical reconstruction that clearly lacks conversation rationale MAY remain:

`EXTERNAL CONTEXT PENDING`

Repository-native Historical Replay MUST NOT be blocked solely because conversation acquisition is unavailable.

Genesis MUST continue reconstructing repository-native evidence without guessing missing human intent.

## Support Classification

Genesis conversation-source capability MUST distinguish:

- `SUPPORTED AND INGESTIBLE`;
- `SUPPORTED BUT REQUIRES COMPILER COMPLETION`;
- `SOURCE ACCESS BLOCKED`;
- `ARCHITECTURALLY UNDEFINED`.

Classification MUST derive from acquisition availability, compiler availability, and governed Knowledge-path availability.

The classifications MUST NOT be treated as aliases.

## Milestone 37 Stop Boundary

Milestone 37 MUST NOT:

- implement ChatGPT acquisition;
- scrape conversation history;
- create an external conversation connector;
- fabricate Conversation Evidence;
- substitute Git history for conversations;
- execute Historical Replay;
- mutate Knowledge Operations;
- redesign Genesis UI;
- evaluate educational eligibility;
- activate Chief Agent education;
- build the Executive Office.

Milestone 37 establishes and certifies the conversation-source boundary only.

A future acquisition milestone MAY replace `SOURCE ACCESS BLOCKED` only when a governed source mechanism actually exists.

When a governed acquisition mechanism later becomes available, Genesis MAY transition from `SOURCE ACCESS BLOCKED` to `SUPPORTED AND INGESTIBLE` without changing the certified Conversation Compiler contract, provided the compiler and governed Knowledge path remain valid.

Conversation acquisition capability and Conversation compiler capability MUST remain independently represented.

Unavailable conversation acquisition MUST NOT block repository-native Historical Replay.

Unavailable conversation acquisition MUST NOT be satisfied by substituting Git commits, Git messages, documentation, Runtime telemetry, or other repository evidence for Conversation Evidence.

A change in acquisition capability MUST be capable of changing the conversation-source boundary projection identity.

A change in compiler capability MUST be capable of changing classification independently from acquisition capability.













A failed replay MAY be restarted from the beginning of the same deterministic manifest.

Runner restart safety depends on the Genesis Admission Identity idempotency contract.

When a restarted replay encounters an unchanged Historical Source version that was successfully admitted during an earlier failed attempt:

- it MUST resolve to the same Genesis Admission Identity;
- the admission adapter MUST reuse the same durable Evidence identity;
- a duplicate Evidence object MUST NOT be created;
- the replay may reconstruct its state/checkpoint deterministically from the beginning;
- repeating the same replay/manifest/position occurrence MUST NOT create duplicate occurrence provenance.

A later Historical Source that was never successfully admitted remains independently admissible during the retry.

Runner restart therefore provides at-least-once execution attempts with effectively-once Evidence creation per repository-scoped Historical Source version.

`discoveredAt` and other operational discovery-attempt timestamps are retained for provenance and observability but MUST NOT participate in manifest identity.

The manifest replay-contract version and Replay Scope replay-contract version MUST agree. A contradictory version declaration is invalid and MUST be rejected.

---

# 10. Replay Identity

Every Historical Replay execution MUST have a stable Replay Identity.

Replay identity is derived from:

- manifest identity;
- replay-contract version;
- replay scope.

Format:

`genesis-replay:<manifest-identity>`

Re-running the same manifest under the same contract and scope MUST produce the same Replay Identity.

An execution attempt MAY have a separate attempt identifier for diagnostics.

Attempt identity MUST NOT replace Replay Identity.

This distinction allows deterministic replay with operational retry history.

---

# 11. Replay Scope

Historical Replay MUST operate against an explicit Replay Scope.

A replay scope defines:

- repository;
- branch/ref boundaries where relevant;
- chronological start boundary;
- chronological end boundary;
- included source classes;
- excluded source classes;
- explicit source exclusions;
- governance policy version;
- replay-contract version.

A full Genesis replay uses the complete approved historical scope.

Replay Scope MUST explicitly declare whether the replay is `full` or `partial`.

A `full` replay scope is unbounded by historical start/end, is not restricted to a Git branch/ref, includes every governed Evidence type, and contains no source or Evidence-type exclusions.

A Git branch/ref boundary is selective historical scope and therefore MUST be represented as `partial`.

Any chronologically bounded or otherwise selectively scoped replay MUST be represented as `partial`.

Partial replay is permitted for:

- recovery;
- testing;
- diagnostics;
- incremental expansion;
- isolated source-class validation.

Partial replay MUST be identified as partial and MUST NOT be represented as a complete Genesis Corpus.

---

# 12. Replay Scope Governance

Replay scope is governed configuration.

The replay engine MUST NOT independently decide to exclude historically significant material.

Exclusions MUST be recorded.

Each exclusion requires:

- source identity;
- exclusion reason;
- governing actor or policy;
- exclusion timestamp;
- scope in which exclusion applies.

Material constitutional to Initial Competency MUST NOT be silently excluded.

---

# 13. Deduplication

Historical Replay MUST be idempotent.

A historical source is considered the same source when its Historical Source Identity and checksum are unchanged.

Duplicate admission rules:

Same identity + same checksum:
- identical source;
- do not create duplicate Evidence.

Same identity + different checksum:
- source mutation or version conflict;
- do not silently overwrite;
- mark the source as changed;
- require version/provenance reconciliation.

Different identity + same checksum:
- distinct provenance may exist;
- retain both source identities;
- content-level deduplication MAY be recorded as a relationship;
- provenance MUST NOT be collapsed.

Deduplication operates before Evidence admission.

At the discovery boundary:

- same Historical Source Identity + same checksum + compatible provenance is one discovered source;
- same Historical Source Identity + different checksum is a mutation/conflict condition;
- same Historical Source Identity + incompatible source class, Evidence type, or provenance is an identity-contract conflict.

Discovery MUST NOT silently select one conflicting representation.

When multiple discoverers independently observe the same compatible Historical Source Identity, Genesis MUST preserve the discovery multiplicity by retaining the stable identities of every discoverer that observed the source.

The source record remains deduplicated.

Discovery-result errors MUST be returned in deterministic canonical order so manifest/discovery diagnostics do not depend on connector or filesystem return order.

Knowledge-level deduplication remains owned by Knowledge Operations.

Historical Replay MUST NOT infer that two sources mean the same thing merely because their content is similar.

---

# 14. Source Mutation Detection

Evidence is immutable.

Historical Replay MUST detect when a previously manifested historical source changes.

Mutation detection compares:

- Historical Source Identity;
- previously recorded checksum;
- current checksum.

A mutation produces a reconciliation condition.

The replay engine MUST NOT:

- overwrite prior evidence;
- conceal the earlier version;
- silently treat the changed source as identical.

Where historical versions are recoverable, both versions SHOULD be preserved with version lineage.

---

# 15. Checkpoint Semantics

Historical Replay MUST support resumable execution.

A Replay Checkpoint represents completed evidence admission through a deterministic manifest position.

A checkpoint MUST contain:

- replayId;
- manifestId;
- replay-contract version;
- lastCompletedHistoricalSourceId;
- lastCompletedManifestIndex;
- admittedEvidenceIds;
- skippedSourceIds;
- blockedSourceIds;
- checkpointCreatedAt.

Checkpoint advancement occurs only after a source reaches a terminal replay disposition:

- ADMITTED;
- SKIPPED;
- BLOCKED.

`ADMITTED` MUST retain the admitted Evidence identity.

`SKIPPED` and `BLOCKED` MUST retain an explicit reason.

A checkpoint MUST represent a contiguous completed prefix of the deterministic manifest. It MUST NOT advance past a source that has no terminal disposition.

A source currently being processed MUST NOT advance the checkpoint.

---

# 16. Checkpoint Integrity

A checkpoint may resume only when:

- replayId matches;
- manifestId matches;
- replay-contract version matches;
- replay scope matches;
- source checksums through the checkpoint remain unchanged.

The checkpoint MUST retain the Historical Source Identity and source checksum for every source in its completed manifest prefix.

Resume validation MUST compare those retained source snapshots against the current manifest rather than relying only on the manifest identifier.

A checksum mutation before or at the checkpoint invalidates resume.

A source change strictly after the checkpoint does not invalidate the integrity of the already-completed prefix, although it may alter the resulting manifest/replay plan under higher-level reconciliation.

If these conditions fail, automatic resume MUST stop.

The replay MUST require reconciliation or restart from an earlier valid checkpoint.

Historical Replay MUST NOT continue from a checkpoint belonging to a different manifest.

---

# 17. Exactly-Once Evidence Admission

Historical Replay provides logically exactly-once Evidence admission through deterministic source identity and idempotent Evidence identity.

Operational execution may retry.

Retries MUST NOT produce duplicate Evidence.

The replay engine MUST determine whether evidence has already been admitted for the Historical Source Identity before creating a new Evidence record.

Exactly-once here means logical evidence identity, not guaranteed single physical function invocation.

---

# 18. Evidence Mapping

Recovered sources MUST map to existing Evidence types.

No Genesis-specific Evidence type is introduced by this contract.

Current governed mappings include:

ADR
→ ADR evidence

RFC
→ RFC evidence

Architecture document
→ document evidence

Specification
→ specification evidence

Roadmap
→ roadmap evidence

Source file
→ source-file evidence

Git commit
→ commit evidence

Git tag
→ tag evidence

Git branch
→ branch evidence

Runtime event
→ runtime-event evidence

Conversation
→ conversation evidence

Engineering execution
→ engineering-execution evidence

Issue
→ issue evidence

Pull request
→ pull-request evidence

Incident
→ incident-log evidence

Build
→ build-output evidence

A new Evidence type requires separate architectural governance.

---

# 19. Evidence Construction

Historical Replay discovers and reconstructs Evidence.

Historical Replay does not compile knowledge.

For each admitted source, the replay layer constructs an Evidence item preserving:

- Historical Source Identity;
- native source identity;
- provenance;
- checksum;
- historical timestamp;
- replay identity;
- manifest identity;
- source authority;
- replay scope;
- content reference or governed content;
- source relationships where known.

That Evidence is then submitted to the existing Knowledge Preservation Platform.

---

# 20. Compiler Boundary

Compilers consume Evidence.

Compilers MUST NOT perform Genesis source discovery.

Compilers MUST NOT control replay ordering.

Compilers MUST NOT update replay checkpoints.

Compilers MUST NOT grant canonical status.

Historical Replay owns discovery and chronological reconstruction.

Knowledge Preservation owns:

Evidence
→ Compiler
→ Knowledge IR
→ Validation
→ Package Assembly

Governance owns:

Review
→ Approval
→ Canonical Promotion

Organizational Memory owns governed adaptation from canonical authority.

---

# 21. Conversation Recovery

Historical conversations are Evidence.

Raw conversation transcripts are not Canonical Knowledge.

Conversation replay MUST preserve:

- conversation identity;
- chronological order;
- participant role where available;
- project/repository context where available;
- message or event sequence;
- timestamps;
- provenance;
- content checksum;
- relationship to resulting implementation where discoverable.

Conversation-derived:

- decisions;
- principles;
- lessons;
- architecture changes;

remain subject to human review under Knowledge governance.

A conversation may explain intent.

It does not override stronger governing evidence.

---

# 22. Git History Recovery

Git history is a primary Genesis source.

Git History Discovery V1 reconstructs immutable commit records reachable from the approved Replay Scope.

Commit SHA is the native immutable Historical Source Identity key.

Git parent topology and historical replay chronology are separate dimensions. Parent SHAs define ancestry; replay chronology uses the governed historical timestamp ordering contract.

For commit sources, committer time is the V1 historical replay timestamp. Author time MUST also be retained as provenance and MUST NOT be discarded.

A ref-bounded partial replay discovers commits reachable from that ref. An unbounded replay discovers commits across all local repository refs.

Chronological start/end boundaries SHOULD preserve reachable commits in discovery while marking out-of-range commits excluded, rather than erasing their existence from the discovered history.

Direct branch/tag refs pointing at a commit MAY be retained when recoverable. Genesis MUST NOT infer false ancestry or causation from ref names.

Commit recovery MUST preserve at minimum:

- commit SHA;
- parent SHAs;
- author identity where available;
- committer identity where available;
- author timestamp;
- committer timestamp;
- subject;
- body;
- changed-path references;
- branch/tag relationships where recoverable;
- repository identity.

Git topology MUST be preserved independently from chronological replay order.

Changed-path references MUST be deterministic and MUST NOT depend on Git command return ordering.

For non-root commits, Git History Discovery SHOULD retain changed paths relative to each parent. A deterministic union MAY also be exposed for indexing and search.

For merge commits, parent-relative changed-path sets MUST remain distinguishable so Genesis does not erase merge topology.

Annotated tag refs MUST be peeled to their referenced commit when associating refs with commit Historical Sources. The tag ref name itself remains provenance; the annotated tag object's SHA MUST NOT be mistaken for the commit SHA.

Historical Replay MUST NOT flatten merge ancestry into false linear causation.

Historical Replay MUST NOT reinterpret timestamp order as Git parentage.

Chronological order is used for education and reconstruction.

Git parent relationships remain the authority for commit ancestry.

---

# 23. Documentation Recovery

Documentation recovery MUST preserve document authority and governance metadata.

Documentation discovery MUST use deterministic repository-relative traversal and MUST NOT depend on filesystem return order.

Document Historical Source Identity MUST be based on stable repository provenance rather than document content. Content checksum remains the mutation/version signal.

Documentation discovery MUST NOT follow symbolic links outside the governed repository traversal.

A trustworthy historical timestamp SHOULD be resolved from repository history or explicit governed document metadata. If no trustworthy historical timestamp exists, discovery MUST NOT invent one; the source remains represented but BLOCKED with a timestamp-unavailable condition.

Documentation Discovery V1 represents the currently checked-out governed document version. When Git history is used for that version, its timestamp semantics are the document path's last repository change time (`git-last-change-time`), not original document creation time.

Documentation Discovery V1 MUST NOT imply that earlier document versions have been reconstructed.

Historical document-version reconstruction belongs to Git History Discovery and later historical reconciliation.

Operational `discoveredAt` time is provenance only and MUST remain distinct from historical time.

Documents outside the selected replay scope SHOULD remain represented with an explicit exclusion disposition rather than disappearing from the discovery record.

The default governed-document allowlist for the first Genesis corpus includes explicit Canon, Constitution, Governance, ADR, RFC, Architecture, Specification, Roadmap, Certification, and Blueprint locations.

Archived documents and handoffs are historical evidence and MUST NOT enter this current-governed-document discoverer implicitly. They require a later explicit historical-source scope.

Documents MUST NOT be treated equally merely because they are Markdown files.

Replay must preserve distinctions including:

- Constitution;
- constitutional amendments;
- governance documents;
- ADRs;
- RFCs;
- architecture documents;
- specifications;
- roadmaps;
- reconciliations;
- certification records;
- archived/superseded documents;
- handoffs and operational notes.

Superseded material remains historically relevant.

Superseded material does not retain current governing authority merely because it appears earlier chronologically.

---

# 24. Authority vs Chronology

Historical Replay preserves both:

Historical truth:
- what existed;
- when it existed;
- what changed;
- what failed;
- what succeeded.

Governing truth:
- which source had authority;
- which source superseded another;
- which source is currently governing;
- which knowledge is canonical.

Chronology MUST NOT override authority.

Authority MUST NOT erase chronology.

Both dimensions are required for Chief Agent education.

---

# 25. Conflict Preservation

Historical contradictions are educational evidence.

Replay MUST preserve known:

- architecture conflicts;
- competing approaches;
- reverted implementations;
- failed fixes;
- superseded decisions;
- regression-causing changes;
- contradictory conversations;
- later corrections.

Historical Replay MUST NOT rewrite the past into a falsely consistent narrative.

Conflict resolution belongs to governance and Knowledge reconciliation.

---

# 26. Failure Preservation

Failed approaches are part of the Genesis curriculum.

Where supported by evidence, replay SHOULD preserve:

- failed builds;
- rejected patches;
- regressions;
- rollback commits;
- runtime failures;
- incident evidence;
- abandoned designs;
- user rejection or correction;
- subsequent recovery.

A failed historical approach is not automatically reusable knowledge.

It is evidence from which Knowledge Operations may derive negative or contextual learning.

---

# 27. Replay Dispositions

Every manifest source processed by replay reaches exactly one disposition:

ADMITTED
- converted into Evidence and accepted by the preservation boundary.

SKIPPED
- intentionally excluded under approved scope/governance.

BLOCKED
- cannot safely or deterministically enter Evidence.

A blocked source MUST preserve:

- source identity;
- blocking reason;
- provenance;
- checkpoint relationship.

Blocked sources MUST NOT disappear silently.

---

# 28. Replay Error Model

Replay errors are classified as:

SOURCE_UNAVAILABLE
SOURCE_MUTATED
SOURCE_IDENTITY_AMBIGUOUS
TIMESTAMP_UNAVAILABLE
PROVENANCE_INCOMPLETE
CHECKSUM_MISMATCH
CHECKPOINT_MISMATCH
UNSUPPORTED_EVIDENCE_TYPE
GOVERNANCE_BLOCKED
EVIDENCE_ADMISSION_FAILED

Errors MUST be attached to Historical Source Identity.

Operational retries MUST preserve diagnostic history.

---

# 29. Missing Timestamps

A source without a trustworthy historical timestamp MUST NOT receive an invented historical timestamp.

Such a source is classified as chronology-incomplete.

The manifest MAY preserve it.

Replay MAY:

- block it;
- place it in an explicitly unordered historical segment;
- use a governing source-derived timestamp if that derivation is explicit and auditable.

Replay execution time MUST NOT masquerade as historical time.

---

# 30. Genesis Corpus

The Genesis Corpus is the governed source set produced by Historical Replay.

The Genesis Corpus consists of:

- source manifest;
- replay identity;
- replay scope;
- admitted historical Evidence;
- exclusions;
- blocked-source records;
- chronology;
- provenance;
- source authority;
- conflicts;
- supersession relationships;
- replay checkpoints and completion state.

The Genesis Corpus is not itself Canonical Knowledge.

It is the governed historical substrate from which Knowledge Operations produces educational knowledge.

---

# 31. Genesis Corpus Completeness

A Genesis Corpus may be classified as:

PARTIAL
COMPLETE
BLOCKED

Replay execution state is distinct from corpus completeness and uses:

- pending;
- running;
- completed;
- blocked;
- failed.

Execution status MUST NOT be used as a substitute for corpus completeness.

PARTIAL:
- approved replay scope has not been fully processed.

COMPLETE:
- every source within approved scope reached ADMITTED or approved SKIPPED disposition;
- no unresolved source remains BLOCKED;
- completed-source count equals the deterministic manifest source count.

A replay MUST NOT claim COMPLETE while any manifest source lacks a terminal disposition.

A BLOCKED terminal disposition halts deterministic forward progression until governance or source reconciliation resolves the blocker.

BLOCKED:
- one or more mandatory sources prevent completion.

A corpus MUST NOT claim COMPLETE merely because replay reached the end of an available list.

Completeness is measured against approved replay scope.

---

# 32. Educational Boundary

Genesis produces historical educational substrate.

Genesis does not activate Chief Agent.

The educational lifecycle remains:

Historical Replay
→ Genesis Corpus
→ Repository Knowledge Seeding
→ governed Knowledge Operations
→ Educational Corpus
→ Initial Competency
→ Human-authorized Activation
→ Continuous Learning

Chief Agent autonomous learning is downstream.

---

# 33. Runtime Boundary

Historical Replay MUST NOT depend on Runtime being active to reconstruct repository history or historical documentation.

Runtime may be a historical evidence source.

Runtime is not the source of truth for historical repository state.

Current Runtime state MUST NOT be projected backward as historical state.

---

# 34. Persistence Boundary

Genesis persistence MUST be separate from:

- production Knowledge Package storage;
- Canonical Knowledge storage;
- Organizational Memory storage;
- Manufacturing Replay ephemeral state.

Genesis may maintain durable stores for:

- manifests;
- replay executions;
- checkpoints;
- source discovery records;
- exclusions;
- blocked-source records.

Genesis storage MUST use the repository's central storage-isolation contract so tests cannot contaminate production Genesis state.

---

# 35. Testability Requirements

Historical Replay implementation MUST be testable against deterministic fixtures.

Tests MUST prove:

- stable Historical Source Identity;
- stable manifest identity;
- deterministic ordering;
- deterministic replay identity;
- duplicate source suppression;
- source mutation detection;
- checkpoint resume;
- checkpoint mismatch rejection;
- exact logical Evidence admission;
- conversation preservation;
- Git chronology plus parent topology preservation;
- authority independent from chronology;
- blocked-source preservation;
- zero automatic canonical promotion;
- zero automatic Organizational Memory adaptation;
- production storage isolation.

Tests MUST NOT require mutation of legitimate production Knowledge state.

---

# 36. Observability Requirements

Historical Replay SHOULD expose sufficient state to answer:

- what replay is running;
- what manifest it uses;
- what scope it covers;
- how many sources were discovered;
- how many were admitted;
- how many were skipped;
- how many were blocked;
- current manifest position;
- current historical source;
- checkpoint position;
- completion status;
- last error.

Observability does not imply UI implementation in Genesis Stage 1.

---

# 37. Security and Privacy

Historical Replay MUST preserve privacy boundaries.

Customer-specific historical sources MUST NOT automatically become global organizational knowledge.

Conversation and project history remain scoped Evidence until governance permits generalization.

Sensitive content SHOULD be referenced rather than duplicated where the Evidence model supports governed content references.

Cross-customer reuse remains controlled by Canonical Knowledge and Organizational Memory governance.

---

# 38. Initial Implementation Sequence

Historical Replay implementation MUST proceed in this order:

1. Historical Source domain model
2. Genesis Source Manifest model
3. deterministic source identity
4. deterministic manifest identity
5. replay scope model
6. deterministic ordering engine
7. checkpoint model
8. replay state model
9. discovery interfaces
10. documentation discovery
11. ADR / RFC / architecture / specification discovery
12. Git history discovery
13. conversation discovery
14. runtime-event discovery
15. engineering-execution discovery
16. Evidence mapper
17. Knowledge Preservation admission adapter
18. durable Genesis persistence
19. runtime routes
20. builder observability only after runtime contract is production-valid

The first implementation MUST NOT begin with UI.

---

# 39. First Recoverable Corpus

The first production Genesis corpus SHOULD be bounded and auditable.

Recommended first governed scope:

- KoreLumina constitutional documents;
- approved constitutional amendments;
- governance documents;
- ADRs;
- RFCs;
- architecture documents;
- specifications;
- Knowledge Operations reconstruction certification;
- repository Git history.

Conversation history enters after its historical source connector is deterministic and privacy-safe.

This staged recovery prevents an unbounded conversation archive from becoming the first source of truth.

---

# 40. Non-Goals of V1

Historical Replay Contract V1 does not define:

- Chief Agent activation;
- Chief Agent autonomous execution;
- post-activation continuous-learning episodes;
- cross-customer global learning;
- semantic pattern extraction;
- model training or fine-tuning;
- educational UI;
- automated human approval;
- automatic Canonical Promotion;
- automatic Organizational Memory adaptation.

Those remain separate governed milestones.

---

# 41. V1 Invariants

Historical Replay V1 MUST preserve all of the following:

Discovery ≠ Compilation

Evidence ≠ Knowledge IR

Knowledge IR ≠ Knowledge Package

Knowledge Package ≠ Canonical Knowledge

Historical Replay ≠ Manufacturing Replay

Genesis Corpus ≠ Canonical Knowledge

Genesis Corpus ≠ Organizational Memory

Chronology ≠ Authority

Replay execution time ≠ Historical time

Canonical Review ≠ Canonical Promotion

Canonical Promotion ≠ Organizational Memory Adaptation

Chief Agent education ≠ Chief Agent activation

These invariants are release-blocking architecture contracts.

---

# 42. Release Criterion for Historical Replay Implementation

Historical Replay implementation may be considered production-ready only when:

- the same historical source set produces the same manifest;
- the same manifest produces the same replay identity;
- ordering is deterministic;
- evidence admission is idempotent;
- checkpoints resume safely;
- source mutation is detected;
- provenance remains traceable;
- authority remains distinct from chronology;
- replay cannot directly create Canonical Knowledge;
- replay cannot directly create Organizational Memory;
- tests cannot mutate production Knowledge or Genesis stores;
- the Genesis Corpus reports truthful completeness;
- all Knowledge Operations governance invariants remain intact.

---

# 43. Architectural Determination

Historical Replay is the governed chronological reconstruction layer between KoreLumina's historical sources and the existing Knowledge Preservation Platform.

It reconstructs history.

It does not interpret history into final organizational truth.

Knowledge Operations performs that transformation under governance.

The Genesis Corpus is therefore:

a deterministic, provenance-preserving, authority-aware historical educational substrate,

not a canonical knowledge database.

This contract resolves the V1 replay identity, source identity, deterministic ordering, deduplication, checkpoint, resume, mutation-detection, scope, and ingestion-boundary requirements required before Genesis implementation begins.
