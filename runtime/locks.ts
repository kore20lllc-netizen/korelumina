const locks = new Set<string>();

export function acquireLock(key: string): boolean {
  if (locks.has(key)) return false;
  locks.add(key);
  return true;
}

export function releaseLock(key: string) {
  locks.delete(key);
}

export function isLocked(key: string) {
  return locks.has(key);
}
