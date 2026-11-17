/**
 * A gzipped tar archive, the format of backups. Tar keeps each file as raw bytes, so tables and
 * images are not inflated by text encoding, and `tar -xzf` can open a backup.
 */

const BLOCK = 512;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type ArchiveEntry = { name: string; data: Blob | Uint8Array<ArrayBuffer> | string };

function writeField(header: Uint8Array, offset: number, length: number, value: string) {
  header.set(encoder.encode(value).subarray(0, length), offset);
}

/** An octal number padded to fill a field, ending in a NUL. */
function octal(value: number, length: number) {
  return value.toString(8).padStart(length - 1, '0') + '\0';
}

function checksum(header: Uint8Array) {
  let sum = 0;
  // The checksum field counts as spaces while the sum is taken.
  for (let index = 0; index < BLOCK; index++) {
    sum += index >= 148 && index < 156 ? 32 : header[index];
  }
  return sum;
}

function ustarHeader(name: string, size: number) {
  if (!/^[\w./-]+$/.test(name) || encoder.encode(name).length > 100) {
    throw new Error(`Unsupported archive file name: ${name}`);
  }
  const header = new Uint8Array(BLOCK);
  writeField(header, 0, 100, name);
  writeField(header, 100, 8, octal(0o644, 8));
  writeField(header, 108, 8, octal(0, 8));
  writeField(header, 116, 8, octal(0, 8));
  writeField(header, 124, 12, octal(size, 12));
  writeField(header, 136, 12, octal(Math.floor(Date.now() / 1000), 12));
  header[156] = 0x30; // '0', a regular file
  writeField(header, 257, 6, 'ustar\0');
  writeField(header, 263, 2, '00');
  writeField(header, 148, 8, octal(checksum(header), 7) + ' ');
  return header;
}

/** Packs files into an uncompressed tar archive. Blobs are referenced, not copied. */
export function createTar(entries: ArchiveEntry[]) {
  const parts: BlobPart[] = [];
  for (const entry of entries) {
    const data = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const size = data instanceof Blob ? data.size : data.byteLength;
    parts.push(ustarHeader(entry.name, size), data);
    const padding = (BLOCK - (size % BLOCK)) % BLOCK;
    if (padding) parts.push(new Uint8Array(padding));
  }
  parts.push(new Uint8Array(BLOCK * 2));
  return new Blob(parts, { type: 'application/x-tar' });
}

function readString(bytes: Uint8Array, offset: number, length: number) {
  const field = bytes.subarray(offset, offset + length);
  const end = field.indexOf(0);
  return decoder.decode(end === -1 ? field : field.subarray(0, end));
}

/** Unpacks a tar archive's regular files, by name. Throws on anything that is not a valid tar. */
export function readTar(bytes: Uint8Array<ArrayBuffer>) {
  const files = new Map<string, Uint8Array<ArrayBuffer>>();
  let offset = 0;
  while (offset + BLOCK <= bytes.length) {
    const header = bytes.subarray(offset, offset + BLOCK);
    if (header.every((byte) => byte === 0)) return files;
    const stored = Number.parseInt(readString(header, 148, 8).trim(), 8);
    if (readString(header, 257, 6) !== 'ustar' || stored !== checksum(header)) {
      throw new Error('The archive is damaged.');
    }
    const size = Number.parseInt(readString(header, 124, 12).trim() || '0', 8);
    const start = offset + BLOCK;
    if (!Number.isSafeInteger(size) || start + size > bytes.length) {
      throw new Error('The archive is damaged.');
    }
    const prefix = readString(header, 345, 155);
    const name = (prefix ? `${prefix}/` : '') + readString(header, 0, 100);
    const type = String.fromCharCode(header[156]);
    if (type === '0' || type === '\0') files.set(name, bytes.subarray(start, start + size));
    offset = start + Math.ceil(size / BLOCK) * BLOCK;
  }
  throw new Error('The archive ends early.');
}

export function gzip(blob: Blob) {
  return new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob();
}

export async function gunzip(blob: Blob) {
  const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Whether a file starts with the gzip signature, as a backup archive does. */
export async function isGzip(file: Blob) {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  return head[0] === 0x1f && head[1] === 0x8b;
}
