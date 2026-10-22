import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/*
 * MS-2026-0013 (Import any repository): unpack an uploaded .zip, .tar.gz or
 * .tgz without trusting it.
 *
 * An archive from a customer is hostile until proven otherwise. Every entry
 * is checked before anything is written:
 * - no absolute paths, drive letters, ".." segments or NUL bytes, and every
 *   resolved path stays inside the destination;
 * - no symbolic or hard links, devices or FIFOs;
 * - no encrypted or zip64 entries, and only stored or deflated data;
 * - limits on entry count, total unpacked size, and per-entry ratio, so a
 *   small archive cannot expand into a disk-filling one;
 * - no two entries that would land on the same file, even on a
 *   case-insensitive disk.
 * macOS metadata (__MACOSX, .DS_Store, ._*) is dropped, and one folder that
 * wraps everything (as in a GitHub download) is removed.
 */

export class ArchiveError extends Error {}

function fail(code: string): never {
  throw new ArchiveError(code);
}

export interface ArchiveLimits {
  maxEntries: number;
  maxTotalBytes: number;
  maxRatio: number;
}

export const DEFAULT_ARCHIVE_LIMITS: ArchiveLimits = {
  maxEntries: 100_000,
  maxTotalBytes: 1024 * 1024 * 1024,
  maxRatio: 1000,
};

export type ArchiveKind = "zip" | "tar.gz";

export function archiveKindOf(fileName: string): ArchiveKind | null {
  if (/\.zip$/i.test(fileName)) return "zip";
  if (/\.(tar\.gz|tgz)$/i.test(fileName)) return "tar.gz";
  return null;
}

interface Entry {
  path: string;
  directory: boolean;
  executable: boolean;
  read: () => Buffer;
  size: number;
}

function cleanPath(raw: string): string | null {
  if (raw.includes("\0")) fail("archive_entry_name_invalid");
  const name = raw.replace(/\\/g, "/");
  if (name.startsWith("/") || /^[A-Za-z]:/.test(name)) fail("archive_entry_path_absolute");
  const segments = name.split("/").filter((segment) => segment !== "" && segment !== ".");
  if (segments.some((segment) => segment === "..")) fail("archive_entry_path_escapes");
  if (segments.length === 0) return null;
  if (segments[0] === "__MACOSX") return null;
  const last = segments[segments.length - 1];
  if (last === ".DS_Store" || last.startsWith("._")) return null;
  return segments.join("/");
}

/* ---------- zip ---------- */

function zipEntries(data: Buffer, limits: ArchiveLimits): Entry[] {
  let eocd = -1;
  for (let index = data.length - 22; index >= Math.max(0, data.length - 65_557); index -= 1) {
    if (data.readUInt32LE(index) === 0x06054b50) {
      eocd = index;
      break;
    }
  }
  if (eocd < 0) fail("zip_not_readable");
  const count = data.readUInt16LE(eocd + 10);
  const directorySize = data.readUInt32LE(eocd + 12);
  const directoryOffset = data.readUInt32LE(eocd + 16);
  if (count === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) fail("zip64_not_supported");
  if (count > limits.maxEntries) fail("archive_has_too_many_entries");
  if (directoryOffset + directorySize > data.length) fail("zip_not_readable");

  const entries: Entry[] = [];
  let cursor = directoryOffset;
  for (let index = 0; index < count; index += 1) {
    if (cursor + 46 > data.length || data.readUInt32LE(cursor) !== 0x02014b50) fail("zip_not_readable");
    const flags = data.readUInt16LE(cursor + 8);
    const method = data.readUInt16LE(cursor + 10);
    const crc = data.readUInt32LE(cursor + 16);
    const compressedSize = data.readUInt32LE(cursor + 20);
    const size = data.readUInt32LE(cursor + 24);
    const nameLength = data.readUInt16LE(cursor + 28);
    const extraLength = data.readUInt16LE(cursor + 30);
    const commentLength = data.readUInt16LE(cursor + 32);
    const external = data.readUInt32LE(cursor + 38);
    const localOffset = data.readUInt32LE(cursor + 42);
    const rawName = data.subarray(cursor + 46, cursor + 46 + nameLength).toString(flags & 0x800 ? "utf8" : "latin1");
    cursor += 46 + nameLength + extraLength + commentLength;

    if (compressedSize === 0xffffffff || size === 0xffffffff || localOffset === 0xffffffff) fail("zip64_not_supported");
    const unixMode = external >>> 16;
    const type = unixMode & 0o170000;
    if (type === 0o120000) fail("archive_contains_symbolic_link");
    if (type !== 0 && type !== 0o100000 && type !== 0o040000) fail("archive_contains_special_file");
    const directory = rawName.endsWith("/") || rawName.endsWith("\\") || type === 0o040000;
    if (!directory && flags & 0x1) fail("zip_entry_encrypted");
    if (!directory && method !== 0 && method !== 8) fail("zip_compression_method_not_supported");
    if (!directory && compressedSize > 0 && size / compressedSize > limits.maxRatio) fail("archive_entry_expands_too_much");

    if (localOffset + 30 > data.length || data.readUInt32LE(localOffset) !== 0x04034b50) fail("zip_not_readable");
    const start = localOffset + 30 + data.readUInt16LE(localOffset + 26) + data.readUInt16LE(localOffset + 28);
    if (start + compressedSize > data.length) fail("zip_not_readable");

    const name = cleanPath(rawName);
    if (name === null) continue;
    entries.push({
      path: name,
      directory,
      executable: (unixMode & 0o111) !== 0,
      size: directory ? 0 : size,
      read: () => {
        const stored = data.subarray(start, start + compressedSize);
        const content = method === 0 ? Buffer.from(stored) : zlib.inflateRawSync(stored, { maxOutputLength: Math.max(1, size) });
        if (content.length !== size) fail("zip_entry_size_mismatch");
        const checksum = (zlib as unknown as { crc32?: (data: Buffer) => number }).crc32;
        if (checksum && checksum(content) >>> 0 !== crc >>> 0) fail("zip_entry_corrupt");
        return content;
      },
    });
  }
  return entries;
}

/* ---------- tar.gz ---------- */

function octal(field: Buffer): number {
  if (field[0] & 0x80) fail("tar_entry_too_large");
  const text = field.toString("latin1").replace(/\0.*$/s, "").trim();
  if (!text) return 0;
  if (!/^[0-7]+$/.test(text)) fail("tar_not_readable");
  return parseInt(text, 8);
}

function paxRecords(content: Buffer): Record<string, string> {
  const records: Record<string, string> = {};
  let cursor = 0;
  while (cursor < content.length) {
    const space = content.indexOf(0x20, cursor);
    if (space < 0) break;
    const length = Number(content.subarray(cursor, space).toString("latin1"));
    if (!Number.isInteger(length) || length <= 0) fail("tar_not_readable");
    const record = content.subarray(space + 1, cursor + length - 1).toString("utf8");
    const equals = record.indexOf("=");
    if (equals > 0) records[record.slice(0, equals)] = record.slice(equals + 1);
    cursor += length;
  }
  return records;
}

function tarEntries(data: Buffer, limits: ArchiveLimits): Entry[] {
  let tar: Buffer;
  try {
    tar = zlib.gunzipSync(data, { maxOutputLength: limits.maxTotalBytes + 64 * 1024 * 1024 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ERR_BUFFER_TOO_LARGE" || /maxOutputLength|Cannot create a Buffer/i.test(String(error))) fail("archive_too_large_when_unpacked");
    fail("tar_gz_not_readable");
  }
  const entries: Entry[] = [];
  let cursor = 0;
  let pending: { path?: string } = {};
  let count = 0;
  while (cursor + 512 <= tar.length) {
    const header = tar.subarray(cursor, cursor + 512);
    if (header.every((byte) => byte === 0)) break;
    count += 1;
    if (count > limits.maxEntries) fail("archive_has_too_many_entries");
    const size = octal(header.subarray(124, 136));
    const type = String.fromCharCode(header[156] || 0x30);
    const start = cursor + 512;
    const end = start + size;
    if (end > tar.length) fail("tar_not_readable");
    const content = tar.subarray(start, end);
    cursor = start + Math.ceil(size / 512) * 512;

    if (type === "x") {
      const records = paxRecords(content);
      if (records.path) pending.path = records.path;
      continue;
    }
    if (type === "g") continue;
    if (type === "L") {
      pending.path = content.toString("utf8").replace(/\0+$/, "");
      continue;
    }
    if (type === "1" || type === "2") fail(type === "2" ? "archive_contains_symbolic_link" : "archive_contains_hard_link");
    if (type === "3" || type === "4" || type === "6") fail("archive_contains_special_file");
    if (type !== "0" && type !== "5" && type !== "7") {
      pending = {};
      continue;
    }

    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/s, "");
    const ustar = header.subarray(257, 262).toString("latin1") === "ustar";
    const prefix = ustar ? header.subarray(345, 500).toString("utf8").replace(/\0.*$/s, "") : "";
    const rawName = pending.path ?? (prefix ? `${prefix}/${name}` : name);
    pending = {};
    const mode = octal(header.subarray(100, 108));
    const cleaned = cleanPath(rawName);
    if (cleaned === null) continue;
    entries.push({
      path: cleaned,
      directory: type === "5",
      executable: (mode & 0o111) !== 0,
      size: type === "5" ? 0 : size,
      read: () => Buffer.from(content),
    });
  }
  return entries;
}

/* ---------- extraction ---------- */

function withoutWrapper(entries: Entry[]): Entry[] {
  const files = entries.filter((entry) => !entry.directory);
  if (files.length === 0) return entries;
  const first = files[0].path.split("/")[0];
  const wrapped = entries.every((entry) => entry.path === first || entry.path.startsWith(`${first}/`)) && files.every((entry) => entry.path.includes("/"));
  if (!wrapped) return entries;
  return entries
    .filter((entry) => entry.path !== first)
    .map((entry) => ({ ...entry, path: entry.path.slice(first.length + 1) }));
}

export interface ExtractResult {
  files: number;
  bytes: number;
}

export function extractArchive(
  kind: ArchiveKind,
  data: Buffer,
  destination: string,
  limits: ArchiveLimits = DEFAULT_ARCHIVE_LIMITS,
): ExtractResult {
  const entries = withoutWrapper(kind === "zip" ? zipEntries(data, limits) : tarEntries(data, limits));
  const files = entries.filter((entry) => !entry.directory);
  if (files.length === 0) fail("archive_is_empty");

  const total = files.reduce((sum, entry) => sum + entry.size, 0);
  if (total > limits.maxTotalBytes) fail("archive_too_large_when_unpacked");

  const seen = new Set<string>();
  for (const entry of files) {
    const key = entry.path.toLowerCase();
    if (seen.has(key)) fail("archive_has_duplicate_entries");
    seen.add(key);
  }

  const root = path.resolve(destination);
  fs.mkdirSync(root, { recursive: true });
  let written = 0;
  for (const entry of entries) {
    const target = path.resolve(root, entry.path);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) fail("archive_entry_path_escapes");
    if (entry.directory) {
      fs.mkdirSync(target, { recursive: true });
      continue;
    }
    const content = entry.read();
    written += content.length;
    if (written > limits.maxTotalBytes) fail("archive_too_large_when_unpacked");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, { flag: "wx", mode: entry.executable ? 0o755 : 0o644 });
  }
  return { files: files.length, bytes: written };
}
