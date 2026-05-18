/**
 * Files that should never be overwritten by the Builder.
 * Extend this list as needed.
 */
const LOCKED_PATTERNS = [
  /^\.env/,
  /^\.git\//,
  /^node_modules\//,
  /^\.next\//,
];

/**
 * Returns true if the given relative file path is protected.
 */
export function isLockedFile(filePath: string): boolean {
  const normalized = filePath.replace(/^\/+/, "");

  return LOCKED_PATTERNS.some((pattern) => pattern.test(normalized));
}
