/** The end of central directory record, which a zip file ends with, before any comment. */
const END_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

const STORED = 0;
const DEFLATED = 8;

function damaged(): never {
  throw new Error('The file is damaged or is not a zip archive.');
}

function findEnd(view: DataView) {
  // The record is 22 bytes, followed by a comment of up to 65,535 bytes.
  const earliest = Math.max(0, view.byteLength - 22 - 0xffff);
  for (let offset = view.byteLength - 22; offset >= earliest; offset--) {
    if (view.getUint32(offset, true) === END_SIGNATURE) return offset;
  }
  return damaged();
}

/**
 * Reads one file from a zip archive, or returns null when it has no such file. Handles the
 * stored and deflated methods, which is all that Office documents use.
 */
export async function readZipEntry(bytes: Uint8Array<ArrayBuffer>, name: string) {
  if (bytes.byteLength < 22) damaged();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = findEnd(view);
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const decoder = new TextDecoder();

  for (let index = 0; index < count; index++) {
    if (offset + 46 > view.byteLength || view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
      damaged();
    }
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const entryName = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;
    if (entryName !== name) continue;

    if (view.getUint32(localOffset, true) !== LOCAL_SIGNATURE) damaged();
    // The local header repeats the name and has its own extra field, of its own length.
    const start =
      localOffset +
      30 +
      view.getUint16(localOffset + 26, true) +
      view.getUint16(localOffset + 28, true);
    const data = bytes.slice(start, start + compressedSize);
    if (data.byteLength !== compressedSize) damaged();
    if (method === STORED) return data;
    if (method !== DEFLATED)
      throw new Error('The file uses an unsupported compression method.');
    const stream = new Blob([data])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  return null;
}
