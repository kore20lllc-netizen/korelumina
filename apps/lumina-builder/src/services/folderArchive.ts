/*
 * MS-2026-0013: a folder picked in the browser becomes a .tar.gz the
 * Runtime archive import accepts. Plain ustar entries, with a PAX record
 * for paths longer than 100 bytes; compressed with the browser's gzip.
 */

const encoder = new TextEncoder();

function octal(value: number, width: number): string {
  return value.toString(8).padStart(width - 1, "0") + "\0";
}

function header(name: string, size: number, type: "0" | "x", mtime: number): Uint8Array<ArrayBuffer> {
  const block = new Uint8Array(512);
  const write = (text: string, offset: number, length: number) => block.set(encoder.encode(text).subarray(0, length), offset);
  write(name, 0, 100);
  write(octal(0o644, 8), 100, 8);
  write(octal(0, 8), 108, 8);
  write(octal(0, 8), 116, 8);
  write(octal(size, 12), 124, 12);
  write(octal(Math.floor(mtime / 1000), 12), 136, 12);
  write("        ", 148, 8);
  write(type, 156, 1);
  write("ustar\0", 257, 6);
  write("00", 263, 2);
  const sum = block.reduce((total, byte) => total + byte, 0);
  write(`${sum.toString(8).padStart(6, "0")}\0 `, 148, 8);
  return block;
}

function padding(size: number): Uint8Array<ArrayBuffer> {
  return new Uint8Array((512 - (size % 512)) % 512);
}

function paxRecord(key: string, value: string): Uint8Array<ArrayBuffer> {
  const body = ` ${key}=${value}\n`;
  let length = encoder.encode(body).length;
  length += String(length + String(length).length).length;
  return new Uint8Array(encoder.encode(`${length}${body}`));
}

export async function folderToTarGz(name: string, entries: { file: File; path: string }[]): Promise<File> {
  const parts: BlobPart[] = [];
  for (const entry of entries) {
    const path = entry.path.replace(/^\/+/, "");
    if (encoder.encode(path).length > 100) {
      const record = paxRecord("path", path);
      parts.push(header("PaxHeader", record.length, "x", entry.file.lastModified), record, padding(record.length));
    }
    parts.push(header(path, entry.file.size, "0", entry.file.lastModified), entry.file, padding(entry.file.size));
  }
  parts.push(new Uint8Array(1024));
  const tar = new Blob(parts);
  const gzip = tar.stream().pipeThrough(new CompressionStream("gzip"));
  const compressed = await new Response(gzip).blob();
  return new File([compressed], `${name}.tar.gz`, { type: "application/gzip" });
}
