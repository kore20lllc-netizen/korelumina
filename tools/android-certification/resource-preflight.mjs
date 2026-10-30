import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateResources } from './contracts.mjs';
// A cache-size heuristic cannot establish build capacity. No Docker container is
// created here: timeout/cancellation therefore cannot leave a probe worker behind.
export function resourcePreflight(measurement, expected, freeDiskBytes, signal) {
  assert(!signal?.aborted, 'Resource admission cancelled');
  validateResources(measurement, expected);
  assert(Number.isSafeInteger(freeDiskBytes) && freeDiskBytes >= 10 * 1024 ** 3, 'Insufficient measured free disk');
  assert(!signal?.aborted, 'Resource admission cancelled');
  return true;
}
export function runnerDiskCapacity(root) {
  const s=fs.statfsSync(root); return s.bavail*s.bsize;
}
