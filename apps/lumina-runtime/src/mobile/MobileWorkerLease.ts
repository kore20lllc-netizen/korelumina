/** Control-plane eligibility only; this is not an executor or proof a native process stopped. */
export const MOBILE_WORKER_LEASE_POLICY = Object.freeze({ minimumTtlMs: 5_000, maximumTtlMs: 300_000, defaultTtlMs: 60_000, maximumExecutionMs: 900_000, maximumRenewals: 20 });
export interface MobileWorkerLease {
  readonly workerId: string;
  readonly fencingToken: number;
  readonly issuedAt: number;
  readonly renewedAt: number;
  readonly expiresAt: number;
  readonly deadline: number;
  readonly renewals: number;
  readonly status: "active" | "revoked";
  readonly revokedAt: number | null;
}
/** Runtime-owned adapter reference and fencing proof, never a substitute for caller authorization. */
export interface MobileWorkerProof { readonly workerId: string; readonly fencingToken: number }
export class MobileWorkerLeaseError extends Error {
  constructor(readonly code: "orchestration_unavailable" | "invalid_lease" | "lease_conflict" | "worker_lease_required" | "fence_rejected" | "lease_expired" | "lease_limit" | "clock_rollback") { super(code); this.name = "MobileWorkerLeaseError"; }
}
export const rejectMobileWorker = (code: MobileWorkerLeaseError["code"]): never => { throw new MobileWorkerLeaseError(code); };
export function validateMobileWorkerLease(value: MobileWorkerLease): boolean {
  if (!value || Object.keys(value).sort().join(",") !== ["workerId", "fencingToken", "issuedAt", "renewedAt", "expiresAt", "deadline", "renewals", "status", "revokedAt"].sort().join(",")) return false;
  return typeof value.workerId === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(value.workerId) &&
    [value.fencingToken, value.issuedAt, value.renewedAt, value.expiresAt, value.deadline, value.renewals].every(Number.isSafeInteger) && value.fencingToken >= 1 && value.issuedAt >= 0 &&
    value.issuedAt <= value.renewedAt && value.renewedAt < value.expiresAt && value.expiresAt <= value.deadline &&
    value.deadline === value.issuedAt + MOBILE_WORKER_LEASE_POLICY.maximumExecutionMs && value.expiresAt - value.renewedAt <= MOBILE_WORKER_LEASE_POLICY.maximumTtlMs &&
    value.renewals >= 0 && value.renewals <= MOBILE_WORKER_LEASE_POLICY.maximumRenewals &&
    (value.status === "active" ? value.revokedAt === null : value.status === "revoked" && Number.isSafeInteger(value.revokedAt) && value.revokedAt! >= value.renewedAt);
}
export function mobileWorkerTime(clock: () => number): number {
  const now = clock(); if (!Number.isSafeInteger(now) || now < 0 || now > Number.MAX_SAFE_INTEGER - MOBILE_WORKER_LEASE_POLICY.maximumExecutionMs) return rejectMobileWorker("invalid_lease"); return now;
}
export function mobileWorkerTtl(ttl: number): number {
  if (!Number.isSafeInteger(ttl) || ttl < MOBILE_WORKER_LEASE_POLICY.minimumTtlMs || ttl > MOBILE_WORKER_LEASE_POLICY.maximumTtlMs) return rejectMobileWorker("invalid_lease"); return ttl;
}
export function assertMobileWorker(lease: MobileWorkerLease | undefined, proof: MobileWorkerProof | undefined, now: number): MobileWorkerLease {
  if (!lease || !proof) return rejectMobileWorker("worker_lease_required");
  if (!validateMobileWorkerLease(lease) || lease.status !== "active" || proof.workerId !== lease.workerId || proof.fencingToken !== lease.fencingToken) return rejectMobileWorker("fence_rejected");
  if (now < lease.renewedAt) return rejectMobileWorker("clock_rollback");
  if (now >= lease.expiresAt) return rejectMobileWorker("lease_expired");
  return lease;
}
