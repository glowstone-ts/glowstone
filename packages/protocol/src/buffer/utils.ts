export function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const output = new Uint8Array(a.length + b.length);
  output.set(a, 0);
  output.set(b, a.length);
  return output;
}

export function toUint8Array(chunk: Uint8Array): Uint8Array {
  return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
}

// mojang's either impl

export type Either<L, R> =
  | { type: "left"; value: L }
  | { type: "right"; value: R };

export const Either = {
  left<L, R = never>(value: L): Either<L, R> {
    return { type: "left", value };
  },
  right<R, L = never>(value: R): Either<L, R> {
    return { type: "right", value };
  }
};