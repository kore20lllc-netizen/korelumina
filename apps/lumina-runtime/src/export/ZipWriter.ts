import { deflateRawSync } from "node:zlib";

/*
 * MS-2026-0017: a minimal ZIP writer (PKWARE APPNOTE 6.3): deflate or
 * store per file, UTF-8 names, one file in memory at a time. Classic ZIP
 * only: an entry or archive past 4 GB is refused rather than written
 * wrong (exports are far smaller once node_modules and builds are left
 * out).
 */

const LIMIT = 0xffffffff;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

interface CentralEntry {
  name: Buffer;
  crc: number;
  compressedSize: number;
  size: number;
  method: number;
  time: number;
  date: number;
  offset: number;
}

export class ZipWriter {
  private offset = 0;
  private readonly entries: CentralEntry[] = [];

  constructor(private readonly write: (chunk: Buffer) => void) {}

  add(name: string, data: Buffer, modified = new Date()): void {
    if (data.length > LIMIT) throw new Error("export_file_too_large");
    const nameBytes = Buffer.from(name, "utf8");
    const deflated = deflateRawSync(data);
    const method = deflated.length < data.length ? 8 : 0;
    const body = method === 8 ? deflated : data;
    const crc = crc32(data);
    const { time, date } = dosDateTime(modified);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(method, 8);
    header.writeUInt16LE(time, 10);
    header.writeUInt16LE(date, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(body.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    header.writeUInt16LE(0, 28);

    if (this.offset + header.length + nameBytes.length + body.length > LIMIT) throw new Error("export_too_large");
    this.entries.push({ name: nameBytes, crc, compressedSize: body.length, size: data.length, method, time, date, offset: this.offset });
    this.write(header);
    this.write(nameBytes);
    this.write(body);
    this.offset += header.length + nameBytes.length + body.length;
  }

  finish(): void {
    if (this.entries.length > 0xffff) throw new Error("export_too_many_files");
    const start = this.offset;
    for (const entry of this.entries) {
      const record = Buffer.alloc(46);
      record.writeUInt32LE(0x02014b50, 0);
      record.writeUInt16LE(0x0314, 4);
      record.writeUInt16LE(20, 6);
      record.writeUInt16LE(0x0800, 8);
      record.writeUInt16LE(entry.method, 10);
      record.writeUInt16LE(entry.time, 12);
      record.writeUInt16LE(entry.date, 14);
      record.writeUInt32LE(entry.crc, 16);
      record.writeUInt32LE(entry.compressedSize, 20);
      record.writeUInt32LE(entry.size, 24);
      record.writeUInt16LE(entry.name.length, 28);
      record.writeUInt16LE(0, 30);
      record.writeUInt16LE(0, 32);
      record.writeUInt16LE(0, 34);
      record.writeUInt16LE(0, 36);
      record.writeUInt32LE((0o100644 << 16) >>> 0, 38);
      record.writeUInt32LE(entry.offset, 42);
      this.write(record);
      this.write(entry.name);
      this.offset += record.length + entry.name.length;
    }
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(this.entries.length, 8);
    end.writeUInt16LE(this.entries.length, 10);
    end.writeUInt32LE(this.offset - start, 12);
    end.writeUInt32LE(start, 16);
    end.writeUInt16LE(0, 20);
    this.write(end);
  }
}
