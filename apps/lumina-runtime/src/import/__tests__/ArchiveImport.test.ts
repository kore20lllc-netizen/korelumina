import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";

import { ArchiveError, archiveKindOf, extractArchive } from "../ArchiveExtract.js";

/* MS-2026-0013: an uploaded archive is unpacked only if every entry is safe. */

interface ZipItem {
  name: string;
  content?: string;
  mode?: number;
  method?: 0 | 8;
  encrypted?: boolean;
  claimedSize?: number;
}

function zip(items: ZipItem[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const item of items) {
    const name = Buffer.from(item.name, "utf8");
    const raw = Buffer.from(item.content ?? "", "utf8");
    const method = item.method ?? 8;
    const data = method === 8 ? zlib.deflateRawSync(raw) : raw;
    const crc = zlib.crc32(raw);
    const size = item.claimedSize ?? raw.length;
    const flags = 0x800 | (item.encrypted ? 1 : 0);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, data);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x031e, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(((item.mode ?? (item.name.endsWith("/") ? 0o040755 : 0o100644)) << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += 30 + name.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(items.length, 8);
  end.writeUInt16LE(items.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directory, end]);
}

function tarHeader(name: string, size: number, type: string, mode = 0o644): Buffer {
  const header = Buffer.alloc(512);
  header.write(name, 0, 100, "utf8");
  header.write(mode.toString(8).padStart(7, "0"), 100);
  header.write(size.toString(8).padStart(11, "0"), 124);
  header.write(type, 156);
  header.write("ustar", 257);
  return header;
}

function tgz(items: Array<{ name: string; content?: string; type?: string; mode?: number; pax?: string }>): Buffer {
  const blocks: Buffer[] = [];
  for (const item of items) {
    if (item.pax) {
      const record = ` path=${item.pax}\n`;
      let length = record.length;
      length += String(length + String(length).length).length;
      const body = Buffer.from(`${length}${record}`);
      blocks.push(tarHeader("PaxHeader", body.length, "x"), body, Buffer.alloc((512 - (body.length % 512)) % 512));
    }
    const content = Buffer.from(item.content ?? "");
    blocks.push(tarHeader(item.name, content.length, item.type ?? "0", item.mode), content, Buffer.alloc((512 - (content.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return zlib.gzipSync(Buffer.concat(blocks));
}

const destination = () => path.join(mkdtempSync(path.join(tmpdir(), "korelumina-archive-")), "project");

function refuses(run: () => unknown, code: string) {
  assert.throws(run, (error: unknown) => error instanceof ArchiveError && error.message === code, code);
}

test("archive types are recognised by name", () => {
  assert.equal(archiveKindOf("app.zip"), "zip");
  assert.equal(archiveKindOf("app.tar.gz"), "tar.gz");
  assert.equal(archiveKindOf("APP.TGZ"), "tar.gz");
  assert.equal(archiveKindOf("app.rar"), null);
});

test("a zip unpacks, without its wrapping folder or macOS metadata, keeping executable scripts", () => {
  const target = destination();
  const result = extractArchive("zip", zip([
    { name: "shop-main/" },
    { name: "shop-main/package.json", content: '{"name":"shop"}' },
    { name: "shop-main/src/index.ts", content: "export {};\n", method: 0 },
    { name: "shop-main/gradlew", content: "#!/bin/sh\n", mode: 0o100755 },
    { name: "__MACOSX/shop-main/._package.json", content: "x" },
    { name: "shop-main/.DS_Store", content: "x" },
  ]), target);
  assert.deepEqual(result, { files: 3, bytes: 15 + 11 + 10 });
  assert.deepEqual(readdirSync(target).sort(), ["gradlew", "package.json", "src"]);
  assert.equal(readFileSync(path.join(target, "src/index.ts"), "utf8"), "export {};\n");
  assert.ok(statSync(path.join(target, "gradlew")).mode & 0o100);
});

test("a tar.gz unpacks, including long names from PAX headers", () => {
  const target = destination();
  const long = `repo/${"deep/".repeat(30)}file.py`;
  extractArchive("tar.gz", tgz([
    { name: "repo/", type: "5" },
    { name: "repo/pyproject.toml", content: "[project]\nname='x'\n" },
    { name: "ignored-short-name", content: "print(1)\n", pax: long },
  ]), target);
  assert.ok(existsSync(path.join(target, "pyproject.toml")));
  assert.equal(readFileSync(path.join(target, long.slice("repo/".length)), "utf8"), "print(1)\n");
});

test("entries that escape the project, links and special files are refused", () => {
  refuses(() => extractArchive("zip", zip([{ name: "../evil.sh", content: "x" }]), destination()), "archive_entry_path_escapes");
  refuses(() => extractArchive("zip", zip([{ name: "a/../../evil.sh", content: "x" }]), destination()), "archive_entry_path_escapes");
  refuses(() => extractArchive("zip", zip([{ name: "/etc/passwd", content: "x" }]), destination()), "archive_entry_path_absolute");
  refuses(() => extractArchive("zip", zip([{ name: "C:\\Windows\\x", content: "x" }]), destination()), "archive_entry_path_absolute");
  refuses(() => extractArchive("zip", zip([{ name: "link", content: "/etc/passwd", mode: 0o120777 }]), destination()), "archive_contains_symbolic_link");
  refuses(() => extractArchive("tar.gz", tgz([{ name: "link", type: "2" }]), destination()), "archive_contains_symbolic_link");
  refuses(() => extractArchive("tar.gz", tgz([{ name: "hard", type: "1" }]), destination()), "archive_contains_hard_link");
  refuses(() => extractArchive("tar.gz", tgz([{ name: "dev", type: "3" }]), destination()), "archive_contains_special_file");
  refuses(() => extractArchive("tar.gz", tgz([{ name: "x", content: "x", pax: "../../escape" }]), destination()), "archive_entry_path_escapes");
});

test("encrypted, lying, oversized, duplicate and empty archives are refused", () => {
  refuses(() => extractArchive("zip", zip([{ name: "a.txt", content: "secret", encrypted: true }]), destination()), "zip_entry_encrypted");
  refuses(() => extractArchive("zip", zip([{ name: "a.txt", content: "abc", claimedSize: 5 }]), destination()), "zip_entry_size_mismatch");
  refuses(() => extractArchive("zip", zip([{ name: "a.txt", content: "a".repeat(10_000) }]), destination(), { maxEntries: 10, maxTotalBytes: 1000, maxRatio: 1e9 }), "archive_too_large_when_unpacked");
  refuses(() => extractArchive("zip", zip([{ name: "a.txt", content: "a".repeat(100_000) }]), destination(), { maxEntries: 10, maxTotalBytes: 1e9, maxRatio: 10 }), "archive_entry_expands_too_much");
  refuses(() => extractArchive("zip", zip([{ name: "a", content: "1" }, { name: "b", content: "2" }, { name: "c", content: "3" }]), destination(), { maxEntries: 2, maxTotalBytes: 1e9, maxRatio: 1e9 }), "archive_has_too_many_entries");
  refuses(() => extractArchive("zip", zip([{ name: "README.md", content: "1" }, { name: "readme.md", content: "2" }]), destination()), "archive_has_duplicate_entries");
  refuses(() => extractArchive("zip", zip([{ name: "__MACOSX/x", content: "1" }]), destination()), "archive_is_empty");
  refuses(() => extractArchive("zip", Buffer.from("not a zip at all, just text"), destination()), "zip_not_readable");
  refuses(() => extractArchive("tar.gz", Buffer.from("not gzip"), destination()), "tar_gz_not_readable");
});
