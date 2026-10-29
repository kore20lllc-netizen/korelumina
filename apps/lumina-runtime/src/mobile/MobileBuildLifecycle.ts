import { MemoryMobileBuildStore, type MobileBuildStore } from "./MobileBuildStore.js";
import type { MobilePackageSpecification, MobilePackageValidationContext } from "./MobilePackageSpecification.js";
import {
  authorizeMobileBuild, classifyMobileBuildFailure, createMobileBuildRequest, freezeMobileBuildValue,
  mobileBuildContractFailure as fail, mobileBuildFields, mobileBuildHash, mobileBuildReference, revalidateMobileBuildSpecification,
  type MobileArtifactEvidence, type MobileArtifactVerifier, type MobileBuildAttempt, type MobileBuildCommand, type MobileBuildRecord, type MobileBuildRequest,
} from "./MobileBuildRequest.js";

const terminal = (attempt: MobileBuildAttempt) => ["completed", "failed", "cancelled"].includes(attempt.state);
const attempt = (request: MobileBuildRequest, number: number): MobileBuildAttempt => freezeMobileBuildValue({
  attemptId: `mobile-attempt:${mobileBuildHash({ requestId: request.requestId, number })}`, number, state: "queued", diagnosticReferences: [], failure: null, artifact: null,
});
/** Runtime lifecycle authority with injected storage, NOT a worker or scheduler.
 * Memory storage preserves the contract-only default; inject FileMobileBuildStore for durability.
 * Future adapters submit observations to Runtime; they never receive mutable state.
 * Execution still requires worker leases and a real independently verified artifact provider.
 */
export class MobileBuildLifecycle {
  #store: MobileBuildStore;
  #verifyArtifact: MobileArtifactVerifier;
  constructor(verifyArtifact: MobileArtifactVerifier = () => null, store: MobileBuildStore = new MemoryMobileBuildStore()) { this.#verifyArtifact = verifyArtifact; this.#store = store; }

  create(input: unknown, specification: MobilePackageSpecification, context: MobilePackageValidationContext): MobileBuildRecord {
    const request = createMobileBuildRequest(input, specification, context);
    const record = freezeMobileBuildValue<MobileBuildRecord>({ request, sequence: 0, attempts: [attempt(request, 1)], distributionVerification: "not-performed" });
    return this.#store.admit({ record, specification }).record;
  }
  get(requestId: string, context: MobilePackageValidationContext): MobileBuildRecord {
    const entry = this.#entry(requestId, context, "view"); return entry.record;
  }
  #entry(requestId: string, context: MobilePackageValidationContext, action: "view" | "manage") {
    authorizeMobileBuild(context, context.projectId, action);
    const entry = this.#store.read(context.projectId, requestId);
    if (!entry || entry.record.request.projectId !== context.projectId) return fail("request_not_found");
    return entry;
  }
  history(requestId: string, context: MobilePackageValidationContext): readonly MobileBuildRecord[] {
    this.#entry(requestId, context, "view");
    return this.#store.history(context.projectId, requestId);
  }
  #commit(expectedSequence: number, record: MobileBuildRecord, specification: MobilePackageSpecification): MobileBuildRecord {
    return this.#store.compareAndSwap(expectedSequence, { record, specification }).record;
  }
  transition(requestId: string, command: MobileBuildCommand, context: MobilePackageValidationContext): MobileBuildRecord {
    const { record, specification } = this.#entry(requestId, context, "manage");
    const keys = ["expectedSequence", "attemptId", "type"];
    const type = command && typeof command === "object" ? Object.getOwnPropertyDescriptor(command, "type")?.value : undefined;
    const extra = type === "fail" ? ["reason"] : type === "complete" ? ["artifactReference"] : type === "diagnostic" ? ["reference"] : [];
    mobileBuildFields(command, [...keys, ...extra]);
    const current = record.attempts[record.attempts.length - 1];
    if (!Number.isSafeInteger(command.expectedSequence) || command.expectedSequence !== record.sequence || command.attemptId !== current.attemptId) return fail("stale_transition");
    if (terminal(current)) return fail("invalid_transition");
    let next: MobileBuildAttempt = { ...current };
    switch (command.type) {
      case "start":
        if (current.state !== "queued") return fail("invalid_transition");
        revalidateMobileBuildSpecification(specification, context);
        if (context.snapshot.commit !== record.request.sourceCommit) return fail("invalid_specification");
        next = { ...next, state: "running" }; break;
      case "verify": if (current.state !== "running") return fail("invalid_transition"); next = { ...next, state: "verifying" }; break;
      case "cancel":
        if (current.state === "cancelling") return fail("invalid_transition");
        next = { ...next, state: current.state === "queued" ? "cancelled" : "cancelling" }; break;
      case "cancelled": if (current.state !== "cancelling") return fail("invalid_transition"); next = { ...next, state: "cancelled" }; break;
      case "fail": {
        const failure = classifyMobileBuildFailure(command.reason);
        if (failure.classification !== command.reason) return fail("invalid_request");
        next = { ...next, state: "failed", failure }; break;
      }
      case "diagnostic":
        if (!mobileBuildReference(command.reference) || current.diagnosticReferences.includes(command.reference) || current.diagnosticReferences.length >= 100) return fail("invalid_request");
        next = { ...next, diagnosticReferences: [...current.diagnosticReferences, command.reference] }; break;
      case "complete": {
        if (current.state !== "verifying" || !mobileBuildReference(command.artifactReference)) return fail("invalid_transition");
        let evidence: MobileArtifactEvidence | null;
        try { evidence = this.#verifyArtifact(command.artifactReference, freezeMobileBuildValue({ request: record.request, attemptId: current.attemptId, specification })); }
        catch { return fail("artifact_not_verified"); }
        if (!evidence || evidence.reference !== command.artifactReference || evidence.verification !== "verified" || evidence.requestId !== requestId ||
          evidence.attemptId !== current.attemptId || evidence.projectId !== record.request.projectId || evidence.target !== record.request.target || evidence.format !== specification.artifact.format ||
          evidence.applicationIdentifier !== specification.applicationIdentifier || evidence.version !== specification.version || evidence.buildNumber !== specification.buildNumber ||
          evidence.sourceSnapshotFingerprint !== record.request.sourceSnapshotFingerprint || evidence.specificationFingerprint !== specification.specificationFingerprint ||
          !/^[a-f0-9]{64}$/.test(evidence.sha256) || !Number.isSafeInteger(evidence.bytes) || evidence.bytes < 1 ||
          evidence.signing !== (specification.artifact.signing === "required" ? "verified" : "unsigned")) return fail("artifact_not_verified");
        // Copy only approved provenance fields; references contain no raw logs or artifact bytes.
        const artifact: MobileArtifactEvidence = { reference: evidence.reference, requestId: evidence.requestId, attemptId: evidence.attemptId,
          projectId: evidence.projectId, target: evidence.target, format: evidence.format, applicationIdentifier: evidence.applicationIdentifier,
          version: evidence.version, buildNumber: evidence.buildNumber, sourceSnapshotFingerprint: evidence.sourceSnapshotFingerprint,
          specificationFingerprint: evidence.specificationFingerprint, sha256: evidence.sha256, bytes: evidence.bytes, verification: "verified", signing: evidence.signing };
        next = { ...next, state: "completed", artifact }; break;
      }
      default: return fail("invalid_request");
    }
    // A verifier must not reenter and overwrite another accepted transition.
    if (this.#store.read(record.request.projectId, requestId)?.record.sequence !== record.sequence) return fail("stale_transition");
    return this.#commit(record.sequence, { ...record, sequence: record.sequence + 1, attempts: [...record.attempts.slice(0, -1), next] }, specification);
  }
  retry(requestId: string, expectedSequence: number, context: MobilePackageValidationContext): MobileBuildRecord {
    const { record, specification } = this.#entry(requestId, context, "manage");
    if (!Number.isSafeInteger(expectedSequence) || expectedSequence !== record.sequence) return fail("stale_transition");
    const current = record.attempts[record.attempts.length - 1];
    if (!(current.state === "cancelled" || (current.state === "failed" && current.failure?.retryable)) || current.number >= record.request.maxAttempts) return fail("retry_denied");
    revalidateMobileBuildSpecification(specification, context);
    if (context.snapshot.commit !== record.request.sourceCommit) return fail("invalid_specification");
    return this.#commit(record.sequence, { ...record, sequence: record.sequence + 1, attempts: [...record.attempts, attempt(record.request, current.number + 1)] }, specification);
  }
}
