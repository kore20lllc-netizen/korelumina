import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type {
  NextFunction,
  Request,
  Response,
} from "express";

/*
 * RT-1: reuse expensive read projections until Runtime state changes.
 *
 * Some reads (the Genesis Day-0 certification candidate in particular)
 * rebuild their answer from every persisted replay on each request, which
 * takes about 12 s and blocks the Runtime. The answer only changes when
 * persisted state changes, so it is reused while all of these hold:
 *
 *  1. no mutating HTTP request (anything but GET, HEAD, OPTIONS) has started
 *     or finished since it was computed (the mutation epoch);
 *  2. no file under the watched state roots has been added, removed,
 *     resized, or modified (the state fingerprint: path, size, mtime);
 *  3. it is younger than the maximum age (a safety bound).
 *
 * Failures are never cached. Each caller gets its own deep copy, so a
 * caller cannot change what the next caller sees.
 */

let mutationEpoch = 0;

export function currentRuntimeMutationEpoch(): number {
  return mutationEpoch;
}

export function bumpRuntimeMutationEpoch(): void {
  mutationEpoch += 1;
}

const READ_ONLY_METHODS = new Set([
  "GET",
  "HEAD",
  "OPTIONS",
]);

export function trackRuntimeMutations(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!READ_ONLY_METHODS.has(req.method.toUpperCase())) {
    bumpRuntimeMutationEpoch();
    res.on("close", bumpRuntimeMutationEpoch);
  }
  next();
}

export interface RuntimeStateRoot {
  root: string;
  exclude?: string[];
}

function walk(
  directory: string,
  excluded: Set<string>,
  out: string[],
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    out.push(`${directory}|missing`);
    return;
  }
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (excluded.has(full)) continue;
    if (entry.isDirectory()) {
      walk(full, excluded, out);
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(full);
        out.push(`${full}|${stat.size}|${stat.mtimeMs}`);
      } catch {
        out.push(`${full}|gone`);
      }
    }
  }
}

export function computeRuntimeStateFingerprint(
  roots: RuntimeStateRoot[],
): string {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const { root, exclude = [] } of roots) {
    const resolved = path.resolve(root);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    walk(
      resolved,
      new Set(exclude.map((item) => path.resolve(resolved, item))),
      lines,
    );
  }
  lines.sort();
  return crypto
    .createHash("sha256")
    .update(lines.join("\n"))
    .digest("hex");
}

export interface RuntimeStateCacheOptions {
  roots: () => RuntimeStateRoot[];
  maxAgeMs?: number;
  now?: () => number;
}

export interface RuntimeStateCachedRead<T> {
  (): T;
  invalidate(): void;
}

const DEFAULT_MAX_AGE_MS = 5 * 60_000;

export function cacheUntilRuntimeStateChanges<T>(
  compute: () => T,
  options: RuntimeStateCacheOptions,
): RuntimeStateCachedRead<T> {
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const now = options.now ?? Date.now;

  let entry:
    | {
        epoch: number;
        fingerprint: string;
        computedAt: number;
        value: T;
      }
    | null = null;

  const read = (() => {
    const epoch = currentRuntimeMutationEpoch();
    const fingerprint = computeRuntimeStateFingerprint(options.roots());

    if (
      entry &&
      entry.epoch === epoch &&
      entry.fingerprint === fingerprint &&
      now() - entry.computedAt < maxAgeMs
    ) {
      return structuredClone(entry.value);
    }

    entry = null;
    const value = compute();

    /*
     * Keep the result only if nothing changed while it was computed.
     */
    if (
      currentRuntimeMutationEpoch() === epoch &&
      computeRuntimeStateFingerprint(options.roots()) === fingerprint
    ) {
      entry = {
        epoch,
        fingerprint,
        computedAt: now(),
        value: structuredClone(value),
      };
    }

    return value;
  }) as RuntimeStateCachedRead<T>;

  read.invalidate = () => {
    entry = null;
  };

  return read;
}
