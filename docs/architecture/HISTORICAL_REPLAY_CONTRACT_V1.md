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
