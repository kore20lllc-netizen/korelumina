import { readFileSync } from "node:fs";
import path from "node:path";

/*
 * MS-2026-0012: the paths git tracks, read from .git/index without running
 * git (formats 2, 3 and 4). A file committed before a .gitignore rule
 * covered it is still tracked, and only the index can tell. Submodule
 * links (mode 160000) are not files and are left out. Returns null when
 * there is no readable index.
 */

const GITLINK = 0o160000;

function readVarint(buffer: Buffer, offset: number): [number, number] {
  let byte = buffer[offset++]!;
  let value = byte & 0x7f;
  while (byte & 0x80) {
    value += 1;
    byte = buffer[offset++]!;
    value = (value << 7) + (byte & 0x7f);
  }
  return [value, offset];
}

export function readGitTrackedPaths(root: string): Set<string> | null {
  let buffer: Buffer;
  try {
    buffer = readFileSync(path.join(root, ".git", "index"));
  } catch {
    return null;
  }
  if (buffer.length < 12 || buffer.toString("ascii", 0, 4) !== "DIRC") return null;
  const version = buffer.readUInt32BE(4);
  if (version < 2 || version > 4) return null;
  const count = buffer.readUInt32BE(8);

  const tracked = new Set<string>();
  let offset = 12;
  let previous = "";
  for (let entry = 0; entry < count; entry += 1) {
    const start = offset;
    if (offset + 62 > buffer.length) return null;
    const mode = buffer.readUInt32BE(offset + 24);
    const flags = buffer.readUInt16BE(offset + 60);
    offset += 62;
    if (version >= 3 && flags & 0x4000) offset += 2;

    let name: string;
    if (version === 4) {
      const [strip, next] = readVarint(buffer, offset);
      offset = next;
      const end = buffer.indexOf(0, offset);
      if (end === -1) return null;
      name = previous.slice(0, previous.length - strip) + buffer.toString("utf8", offset, end);
      offset = end + 1;
    } else {
      const end = buffer.indexOf(0, offset);
      if (end === -1) return null;
      name = buffer.toString("utf8", offset, end);
      offset = start + ((end - start + 8) & ~7);
    }
    previous = name;
    /* Stage bits: during a merge the same path appears more than once. */
    if ((mode & 0o170000) !== GITLINK) tracked.add(name);
  }
  return tracked;
}
