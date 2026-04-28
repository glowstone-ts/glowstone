export function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const output = new Uint8Array(a.length + b.length);
  output.set(a, 0);
  output.set(b, a.length);
  return output;
}

export function toUint8Array(chunk: Uint8Array): Uint8Array {
  return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
}
