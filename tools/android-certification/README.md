# KLM-MOBILE-001I hardened local certification assets

Status: NATIVE EXECUTION DISABLED. Nothing published or dispatched. No image built.
This package is a fail-closed consumer of independently provisioned evidence, not a
provisioner. No Android images, native tools, licenses or cloud resources are created.

## Independently governed execution approval

The sole workflow trigger is workflow_dispatch. One Ubuntu 24.04 AMD64 hosted job,
60-minute timeout, contents:read/actions:read, immutable action commits, disabled
persisted checkout credentials. No deployment, PR triggers or automatic release.
The named android-certification GitHub environment MUST be created/configured under
separate Founder authorization with explicit human required reviewers, prevention
of self-review and a deployment branch policy. None exists at this checkpoint.
The verifier queries its server-side protection and this run's approval history;
missing permissions, network access, history or protection fail closed.

Independent Ed25519 authorization is also required. The private signing key never
enters GitHub or the runner. Protected environment secrets supply:
KLM_CERTIFICATION_APPROVAL_PUBLIC_KEY (public key),
KLM_CERTIFICATION_APPROVAL_ENVELOPE (base64 JSON {payload,signature}), and
KLM_CERTIFICATION_PROVENANCE_B64 (base64 structured provenance JSON), and
KLM_CERTIFICATION_COMPONENT_MEASUREMENT_B64 (the actual component-measurement.json
bytes, canonical base64). This additional evidence comes from the same independently
protected environment, never from project inputs or an arbitrary URL. The verifier
recalculates SHA-256 and checks the decoded components; missing/changed/malformed
bytes fail closed even if the provenance hash has the right format.
These are certification approvals, not production credentials. Each signed payload
has schemaVersion klm-execution-permit:v1, scope one-debug-apk, exact repository,
commit, runId, runAttempt, manifestSha256, provenanceSha256, issuedAt/expiresAt
(maximum one hour), and exact LIMITS from contracts.mjs. Signature covers the UTF-8
payload string, avoiding implicit JSON canonicalization. A run retry requires a new
permit. The public key must be provisioned independently of editable repository code.
A workflow flag, branch input or arbitrary self-signed document cannot replace either
approval boundary. All branch content and the source manifest must still receive
Founder review; code writable by a malicious administrator is outside that boundary.

NativeExecutionEnabled remains false. Changing it alone does not authorize a build.
The two checks (workflow and Runtime harness) both require all receipts. Tokens and
approval environment data are removed before invoking the adapter. Disposable test
identity uses Runtime's existing internal-token resolver; this is not Supabase or
production project-authorization certification. No backend authority changed.

## Exact pins and source evidence

Node 22.23.4 / bundled npm 10.9.9 (official Node release index and SHASUMS256.txt);
Temurin 21.0.13+9 Linux AMD64 base manifest pinned in toolchain.json, from the official
Docker registry and adoptium/containers source revision
 a240a79c19afb3da535529e29ab3156d5c08a6e0.
Capacitor 8.4.3; AGP 8.13.0; Gradle 8.14.3-all with publisher SHA-256;
Android API 36 platform revision 2; Build Tools 35.0.0;
cmdline-tools;19.0, archive commandlinetools-linux-13114758_latest.zip,
164760899 bytes, publisher SHA-1 recorded from Google's repository2-3.xml.
No stronger publisher SHA-256 is invented; the independently verified archive's
SHA-256 must additionally be recorded in provenance before execution approval.
Sources: https://nodejs.org/dist/index.json
https://nodejs.org/dist/v22.23.4/SHASUMS256.txt
https://dl.google.com/android/repository/repository2-3.xml
https://github.com/ionic-team/capacitor/tree/8.4.3/android-template
https://services.gradle.org/distributions/gradle-8.14.3-all.zip.sha256

The hosted OS label is not an immutable VM image. Host Node/npm MUST already match
exact pins or execution rejects. No setup-node download, npm installation, docker
pull/restart/relabel or other provisioning is performed by the workflow. A standard
fresh hosted runner is therefore NOT automatically ready. The actual Android image
is still null and requires separately approved preparation and digest publication.

## Patched non-sensitive fixture

Vite 8.3.5 verified in npm metadata; Node >=22.12 is supported. Four files only,
no credentials, backends, plugins or external assets. com.korelumina.certification,
version 1.0.0, build 1, project klm-android-certification. Genuine npm v3 lock generated
using package-lock-only/ignore-scripts with metadata only; no packages installed.
Generation used local npm 11.7.0 on Node 25.4.0, which produced an expected engines
warning because execution is pinned to Node 22.23.4/npm 10.9.9. Offline normalization,
closure/integrity checks and later pinned-host npm ci are separate validation stages.
dependency-review.json records a live npm bulk-advisory response of zero advisories
for this lock at its checkedAt timestamp. This does NOT certify OS, native wrappers,
Capacitor transitive dependencies or JDK security. Refresh reviews before execution.

## Image assembly and structured provenance

Dockerfile performs OFFLINE assembly only. Supply reviewed inputs/node,
inputs/android-sdk and inputs/mobile. The latter must include archives/node.tar.xz,
archives/android-tools.zip, archives/gradle-all.zip, cache/npm, cache/gradle, locks,
tarballs and integrity.json. Provide genuine fixture and native-wrapper package locks,
Gradle strict verification-metadata.xml, complete resolved dependency graph and cache
manifests. image-check.mjs checks actual Node/npm/JDK/SDK versions, archive checksums,
Capacitor versions, every file hash in both caches/locks/tarballs, and every package
tarball's SRI against BOTH lockfiles. Symlinks, omissions and extra cached files fail.
The image records actual component-measurement.json; provenance must bind its hash.
No circular image digest is embedded. Supply the verified custom image's actual
manifest digest only after independent assembly, SBOM/security review and attestation.

Protected provenance schema is klm-android-provenance:v2, as validated in contracts.mjs:
image/base/platform, exact components and actualComponents, fixtureLockSha256,
recipeSha256, Node/Gradle/archive checksums, componentMeasurementSha256, sdkLicense,
dependencies, resources, network. Complete native dependency closure, real offline
verification, strict SHA-256 Maven verification and no unresolved advisories are
mandatory. Immutable signed provenance ties those measurements to the image. Signer
must verify actual evidence, not populate assertions merely to pass validation.
R1 now replays reviewed native-package.json/native-package-lock.json through npm ci,
never native npm install. New immutable locks/native-replay.json must have schema
android-native-replay:v1, exact Capacitor/Gradle/AGP versions, complete closure,
nativePackageLockSha256, verificationMetadataSha256, scope binding the application
identifier/version/build number and source/specification fingerprints, generatedControls
mapping every generated Gradle/property/wrapper control path to its SHA-256, and
gradleLocks mapping reviewed relative Gradle lockfile paths to their SHA-256.
All these bytes must also appear in the immutable integrity.json file manifest.
The signed provenance dependencies.nativeReplayManifestSha256 is mandatory.

Runtime mounts the trusted replay helper and Gradle init policy read-only. It verifies
seed-cache file contents and completeness, replaces mutable web-build caches, copies
reviewed npm input bytes, rejects mismatched transitive closures, and checks generated
post-Capacitor/configuration build controls against the exact reviewed scope. It then
copies buildscript/project locks and verification-metadata.xml into the generated
Android tree, pins the official Gradle distribution checksum and runs Gradle offline
with strict dependency verification plus strict project/buildscript locking.
Missing artifacts/locks, unexpected Gradle files or substituted AGP/Capacitor fail.
No genuine replay bundle is available yet. Unit fixtures are synthetic and never
constitute dependency evidence; no genuine archive checksum or APK was fabricated.
The isolated VM unit test substitutes a digest only for a tiny Gradle archive stand-in;
production always verifies the real archive using node:crypto. Real pinned Gradle
policy execution and npm offline replay remain external certification prerequisites.

## Licensing

cmdline-tools;19.0, platforms;android-36 revision 2 and build-tools;35.0.0 use
android-sdk-license. Founder must review the exact publisher terms for all selected
packages, authorize acceptance and retain license text SHA-256 and acceptance-evidence
SHA-256. Only then may an authorized provisioner use the pinned sdkmanager --licenses
mechanism. No automatic acceptance, pre-written fake acceptance hash or blanket yes.

## Enforced network and measured resources

No network provisioning is allowed in this workflow. Independently protected,
signed per-run provenance must include network receipt klm-network-enforcement:v1,
mode preprovisioned-control-plane-only, runId/runAttempt/commit, SHA-256 of actual
sudo nft -j list ruleset output, denied metadata/private-network/arbitrary-HTTPS/
container-egress probe evidence hash, and provisioningDisabled:true. The verifier
compares live rules. A declaration without authenticated receipts/live matching rules
fails. Control-plane GitHub approval/runner/artifact traffic alone may be allowlisted.
A separately governed network controller must qualify policy and probes on the target
runner; there is NO such deployed controller/evidence at this checkpoint.

Adapter limits unchanged: 2 CPU, 3 GiB memory/no extra swap, 2 GiB /work tmpfs,
256 MiB /tmp, 256 PIDs and 10-minute build. 10 GiB measured free disk required after
provisioning. Resource receipt klm-resource-measurement:v1 must bind image, fixture
lock and exact adapter SHA-256, include authenticated instrumented-offline-packaging
samples hash, completion, time (<=7 days), exact limits and measured positive peaks
below each ceiling. No cache-size heuristic remains. Missing/unmeasured/oversized or
stale capacity fails closed. Such measurements are NOT available at this checkpoint.
Resource admission now creates ZERO Docker containers or subprocesses; timeout,
cancellation or validation failure cannot leak a resource-probe container. Native
executor's existing owned-container cleanup/fencing remains unchanged. Provider
teardown is still required on runner loss; cleanup never uses global Docker prune.

## Source integrity, evidence and next approval

source-manifest.json covers the three unchanged Android files and every local
certification asset except itself. Recalculate from only this allowlist after changes,
and record its SHA-256 in independent Founder approval. Altered/missing/unexpected
assets fail verification. Checkout must be clean and contain only approved changes
since baseline commit. Nothing from unrelated dirty working-tree content is exported.
One-day public artifact retention only for the reviewed fixture APK and sanitized
provenance/lifecycle results; never raw secrets, full caches, private source or tokens.

Before any execution: separately approve the protected environment/signing authority,
controlled offline image/dependency preparation, network qualification, measured
resource qualification, SDK licenses and public evidence policy; publish/dispatch
only after explicit GREEN. This local hardening does not grant any of those actions.

## R5E coordinated metadata upgrade

CLI/Core/Android are exactly 8.4.3; the native replay policy rejects old 8.0.0
bundles and tar versions below 7.5.21. native/package-lock.json is a genuine
metadata-only npm v3 lock, generated by npm 11.7.0 Arborist on Node 25.4.0.
Its complete graph returned zero findings from the official bulk advisory API
at the recorded review time. This is not package-byte or offline-installation
certification; npm 10.9.9 compatibility remains unverified. The underlying native
Maven/Gradle bundles, actual measurements, licenses, protected approvals and image
still do not exist. Existing limits and nativeExecutionEnabled:false are unchanged.
Previous R5B security findings describe the superseded 8.0.0 graph; no exception
or advisory suppression was applied. No package tarball or installed dependency
was used to generate this lock.

## R6A read-only npm artifact inventory

`offline-npm.mjs` consumes both reviewed v3 lockfile byte streams with independently
supplied expected SHA-256 fingerprints and package identities. It enumerates every
locked optional platform dependency too, deduplicates identical artifact URLs, and
rejects conflicting SRI, unsafe paths, non-registry URLs, symlinks, corrupt bytes,
unexpected artifacts and cache-index substitutions. Actual SHA-512, SHA-256 and size
are calculated from bytes. Missing blobs/index entries produce an incomplete report;
they never become verified artifacts or evidence of a successful offline installation.

Format inspected against installed npm cacache: cache root is npm's `_cacache`,
with `content-v2/sha512/<2>/<2>/<rest>` and `index-v5/<2>/<2>/<rest>` (SHA-256 of
`make-fetch-happen:request-cache:<resolved URL>`). Every index line's SHA-1 checksum
is checked, with the latest matching record authoritative, including deletions.
SHA-1 here protects npm index framing only; package integrity requires SHA-512.

Image preparation must place this exact reviewed helper at
`inputs/mobile/offline-npm.mjs` (the existing Dockerfile copies it). Source-manifest
review and the existing recipe/image provenance remain authoritative. The image
checker requires a dedicated minimal cache at `cache/npm/_cacache` and complete
`integrity.json` file and tarball mappings. Missing helper or fingerprints fail closed.
Only relevant reviewed tarball index records/content belong in that seed cache;
metadata responses, temporary entries and unrelated packages must not be exported.
`strictCache:false` supports read-only diagnostic inspection of a shared local cache;
it does NOT establish a clean certification cache, and image admission always uses
strict inventory validation. Shared-cache content must never be published wholesale.

Pinned npm 10.9.9 actual offline replay, genuine Gradle/Maven closure, image evidence,
licenses, resource measurement and execution approval remain separate prerequisites.
This verifier does not download, install, unpack or execute artifacts.

## R6B local-only dedicated cache preparation

`prepareNpmCache` in `prepare-npm-cache.mjs` reuses the R6A inventory and strict
verifier, plus existing lock closure validation. Callers supply reviewed lock bytes,
independent fingerprints, the canonical shared `_cacache` directory, a private
canonical destination outside it, and explicit positive `maxArtifacts`,
`maxArtifactBytes` (at most 256 MiB), and `maxTotalBytes` limits. The latter measures
unique payload bytes, not total filesystem occupancy; copies/indexes need separate
storage budgeting. Production defaults to exactly 132 artifact URL references;
explicit smaller expected counts exist only for separately reviewed fixture contracts.
Optional foreign-platform artifacts remain required.

There is NO network acquisition implementation. Unknown options, including network
enablement, redirect responses or acquisition callbacks, reject. No credentials,
HTTP requests, npm installation, scripts or package extraction are involved. Future
network capability requires a separately authorized implementation and review.

Preparation deduplicates by SHA-512 identity, independently rehashes source bytes,
and writes only allowlisted blobs and deterministic cache indexes into
`<destination>/cache/npm/_cacache`. The source cache is read-only. Source sharing
is diagnostic only; the destination always receives strict verification. Content is
fsynced and atomically renamed before its index is committed; its directory is
synced. Each URL keeps its own index even when multiple URLs share content.
`plan.json` binds lock fingerprints/count/limits; `receipt.json` binds exact verified
URL/SRI/SHA-256/size records. Missing artifacts produce complete:false, never a
successful offline-installation assertion. Invalid/inconsistent receipts reject.

An exclusive `.owner-lock` prevents concurrent preparers. Normal exceptions and
cancellation release ownership and remove only the helper-owned `.pending` file.
Restart rehashes existing destination bytes before resuming an interrupted content,
index or receipt publication. A process/host crash may leave an owner lock; an
operator must independently confirm the old writer is dead before separately
approving stale-lock recovery. The helper never steals ownership automatically.
The preparation directory must remain private and must not have untrusted writers.
No shared cache, download source, signing authority, or Runtime authority is mutated.

This produces npm cache preparation evidence only. Image `integrity.json`/tarball
export, pinned npm 10.9.9 actual offline replay, missing package acquisition,
Gradle/Maven closure, licenses and native execution approvals remain separate work.

## R6C disabled acquisition boundary and synthetic transfer core

The public `acquireNpmArtifacts()` always rejects with
`acquisition_authorization_unavailable`, before inspecting caller callbacks or
performing I/O. `planNpmAcquisition()` is read-only and binds the 132-reference
inventory to SHA-256 of the existing verifier's ordered lock fingerprint array.
Neither environment values, flags nor caller-injected transports enable acquisition.
The existing signed one-debug-apk permit is not an npm acquisition grant.

There is no real HTTP/DNS/TLS transport in this milestone. Private lexical orchestration
is tested by compiling only a test-harness copy of the source; no private-core accessor
or synthetic injection hook is exported. Tests supply local byte streams and connection
facts. These tests are not evidence of enforced real DNS pinning, certificate validation,
registry connectivity or network acquisition readiness. A future independently governed
connector must derive connection facts from DNS/TLS/socket APIs, reject unexpected or
unsafe destinations before sending, validate the registry certificate and hostname,
require port 443, reject redirects including same-host redirects, and not trust response
headers as connection evidence. The current synthetic policy supports IPv4 only.

Synthetic core limits reflect the proposed real execution contract: 64 MiB received
per artifact, 256 MiB aggregate received (incremented before integrity acceptance),
30 seconds per request, 10 minutes overall, 36 unique missing integrity identities,
sequential transfer and zero automatic retries. A failure terminates the invocation;
future authorization must define durable cumulative budgets across separately resumed
invocations before any network integration. Scaled limits exist only inside lexical tests.

Streams go to private job-owned temporary files and are checked for length and reviewed
SHA-512 before entering quarantine. Quarantine publication is atomic; R6B alone publishes
the final cache and records independent SHA-256/size evidence. The resulting acquisition
receipt is deterministic and requires strict complete closure. No installation success
is asserted. Missing or corrupt artifacts fail closed. Restart rehashes quarantine and
final-cache bytes; normal cancellation removes only job-owned partial files. A crash
may leave an exclusive owner lock requiring separate operator recovery; locks are never
stolen automatically. The private preparation root must have no untrusted writers.

Remaining acquisition blockers are the scoped approval integration, trusted transport,
DNS/connection enforcement qualification and cumulative-budget recovery contract. No
network acquisition, package installation, Android build, or execution approval is
provided by this module. Native execution remains disabled.

## R6D authorization, connector and durable cumulative budget

R6D supersedes R6C's unimplemented-control notes. The existing acquisition module
now contains a separate raw-payload Ed25519 verifier for
`klm-npm-acquisition-permit:v1`, scope `npm-artifact-acquisition`. A grant binds the
repository, full ordered lock-set/inventory fingerprints, exact registry destination,
reviewed IPv4 destinations, fixed byte/transfer/deadline limits, absolute expiry,
budgetId, unique attemptId and create/resume operation. APK permits cannot authorize
acquisition. Resume requires a separately signed fresh attempt against the SAME
budget identity and absolute expiry; no extension or limit reset is accepted.

Production remains DISABLED: `ACQUISITION_AUTHORITY` is deliberately null. No real
public key, budget authentication key or storage root has been provisioned. Callers
cannot supply authority keys, callbacks, environment flags or synthetic transports.
A separately reviewed activation must provision independent trust configuration and
private durable storage; this milestone does not generate or activate real grants.
All signatures in tests use ephemeral fixture-only keys, never production identities.

The private connector resolves registry.npmjs.org with Node DNS, rejects answers
outside the signed public-IPv4 set, connects to one selected numeric address with
TLS SNI/hostname verification and bundled trust roots, and checks the connected
socket BEFORE passing it to the HTTPS agent. Only GET to the exact reviewed HTTPS
URL on port 443 is permitted; redirects/status deviations, URL credentials,
proxy settings and insecure TLS/custom-CA overrides reject. No pool reuse, fallback
host or retry is provided. Connection/response deadlines are 5/10 seconds within
the fixed 30-second request and 10-minute overall caps and signed absolute expiry.
Tests replace lexical dependencies with offline DNS/TLS/HTTP fixtures only. No live
network enforcement or registry connectivity has been certified.

The budget follows Runtime's exclusive-local publication conventions, using a private
trusted filesystem, exclusive owner files, fsynced atomic publication and no lock
stealing. A keyed HMAC-SHA256 journal authenticates each revision, hash-linked history,
identity, cumulative charges, transfer count and consumed attempt IDs. A separately
stored authenticated head detects truncation; a durable spent marker prevents a
missing ledger from becoming a fresh create operation. Missing/corrupt/inconsistent
evidence fails closed. An incomplete journal/head write requires operator recovery,
not an automatic reset. Production budget authentication keys must remain outside
the evidence directory and be independently provisioned; none is present here.

BEFORE opening a connection, the full possible artifact allowance (up to 64 MiB,
limited by remaining aggregate budget) is reserved durably. Successful independently
verified transfers settle to actual bytes. Failed/interrupted/crashed transfers retain
the entire reservation conservatively. Ordinary chunks are covered by their already durable full reservation; observed
failed sizes are recorded at terminalization and successful sizes at settlement.
Oversized failed reads are journaled immediately; overruns permanently deny resumption.
Accounting is artifact response payload accounting, not a claim about TLS/IP wire-byte
billing. The 256 MiB aggregate and 36 transfer counters survive new process instances
and signed resume attempts. Reservations may exhaust the budget before all 36
artifacts are available; no retry or larger-budget authorization is implied.

All cooperating processes must use the same authority-owned budget root and key.
This is single-host trusted-local persistence, not distributed storage. A privileged
operator who rolls back BOTH authenticated history and its head/spent markers is
outside this local-store guarantee; independently anchored anti-rollback operational
controls and filesystem qualification remain prerequisites to production activation.
Native execution, workflow publishing, SDK licensing and build authority are unchanged.

## R6E independent acquisition trust configuration boundary

`acquisition-trust.mjs` validates explicit, independently provisioned trust bytes
against a separate protected bootstrap pin: configuration SHA-256, Ed25519 SPKI
SHA-256, trustId and generation. This is validation only, not trust provisioning or
an existing deployed configuration source. Repository inspection found the APK
verifier uses protected environment evidence; there is no established acquisition
trust loader to activate. No filesystem location, environment selection variable,
production public key or private signing key is introduced here.

The configuration schema is `klm-npm-acquisition-trust:v1`, with exact fields
purpose (`npm-artifact-acquisition`), environment (`production` or `synthetic`),
trustId, positive generation, publicKeyPem (PUBLIC KEY only, Ed25519), notBefore,
and notAfter. Missing bytes, unknown fields, malformed keys, substituted configuration,
wrong SPKI identity, inactive trust and pin mismatches fail closed. Pin values MUST
come from independent reviewed authority; computing an expected pin from the same
untrusted configuration is not evidence of independent trust. An environment label
alone is also not proof that a key was independently reviewed.

The loader returns a frozen, internally recognized receipt; arbitrary request objects
cannot impersonate it. Production requires production-mode trust; synthetic receipts
are rejected even if their contents are copied or request flags claim authorization.
No trust, key or pin can be supplied in an acquisition request. Production authority
remains null; wiring a protected bootstrap provider, provisioning its pin/key/budget
root and activating acquisition still require separate Founder authorization.

The acquisition verifier retains the established raw-payload Ed25519 permit format
and now requires trustId, trustGeneration, trustConfigSha256 and trustRootSha256 to
match the configured acquisition receipt. Permit issuance/lifetime must fit the trust
activation interval. APK and acquisition permit scopes remain separate; the APK
verifier and protected environment logic are unchanged. Budget identity also binds
these trust fields, preventing a rotated root from silently inheriting an old budget.
No legacy unbound permit or fallback key is automatically admitted.

Explicit rotation checks require an increasing generation against the previous
recognized trust receipt. There is no automatic key refresh, retry of previously
rejected permits, or environment fallback. Persisting/anchoring the active pin and
rotation high-water mark is a future protected bootstrap responsibility; this pure
validator does not claim to resist a privileged rollback of all external authority
state. All R6E signatures reuse existing ephemeral baseline test fixtures. No new key
generation code, production trust roots, real permits or network calls are added.

## R6F protected bootstrap and independently anchored rotation

`acquisition-bootstrap.mjs` defines the missing protected adapter boundary. It does
NOT claim a protected configuration source or independent store already exists.
`bootstrapAcquisitionTrust()` accepts no request configuration and remains disabled
because its production adapter descriptor is null. Acquisition calls it before permit
processing; the separately governed acquisition budget authority also remains null.
No environment flag, request field, permit payload or synthetic adapter can install
production trust. Existing APK verification and environment protection are unchanged.

A future operator-installed adapter must provide authenticated `readProtected(domain)`
returning reviewed trust bytes and independent pin, SHA-256 source revision,
observedAt, historyRequired and initialization authorization. These are NEW adapter
requirements, not names of an existing repository service. Configuration must be
fresh within 60 seconds at entry and after anchoring, match the acquisition domain,
pass R6E identity/lifetime validation, and reject synthetic trust in production.
Provider metadata is not itself proof of protected provenance; the provider must
first be independently qualified and installed outside acquisition request authority.

The local rotation journal uses Runtime's existing fsync + exclusive hard-link
publication pattern, private canonical directories and an exclusive non-stealable
owner file. Each append authenticates schema, sequence, previous head, trust identity,
generation, configuration/key fingerprints and activation interval with HMAC-SHA256.
The authentication key must be separately provisioned outside the evidence directory.
Same-generation exact identity is restart-safe; substitutions and older generations
reject. Higher generations require a new durable revision and independently anchored
head. Unknown files, incomplete writes, corruption and uncertain commits fail closed.

Admission additionally REQUIRES an independently controlled witness with authenticated
read and durable atomic compare-and-swap. Its domain/trustId head is checked before
local admission, updated after durable local publication and read back before success.
Missing history cannot be recreated when historyRequired is true or the witness says
initialization already occurred. Concurrent/conflicting CAS cannot both acknowledge
acceptance. Local publication without a confirmed witness commit is deliberately
unavailable until separately authorized recovery; no deletion, reset, lock stealing
or self-healing recovery API is provided.

No such independent witness is deployed or selected. Tests use a synthetic in-memory
witness ONLY to exercise the interface, with real isolated local journal files.
Local hashes/HMACs alone cannot prevent a privileged replacement/deletion of all
local state. Production rollback resistance requires the independent witness to retain
its head and deny unauthorized reset/deletion, even if local storage is replaced.
Without that qualified storage authority, production bootstrap fails closed. No new
infrastructure, keys, real permits, network acquisition or workflow execution is
introduced. Provisioning, backend qualification and explicit recovery remain separate
Founder-controlled prerequisites.
