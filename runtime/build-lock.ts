const locks = new Set<string>();

export function acquireLock(id: string) {
  if (locks.has(id)) return false;
  locks.add(id);
  return true;
}

export function releaseLock(id: string) {
  locks.delete(id);
}
