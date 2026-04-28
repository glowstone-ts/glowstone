const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const LONG_MIN = -(1n << 63n);
const LONG_MAX = (1n << 63n) - 1n;

function assertIntRange(name: string, value: number | bigint, min: number | bigint, max: number | bigint) {
  if (value < min || value > max)
    throw new Error(`${name} out of range (${min}..${max}): ${value}`);
}

export async function readVarInt(readByte: () => Promise<number>): Promise<number> {
  let value = 0;

  for (let index = 0; index < 5; index++) {
    const byte = await readByte();
    value |= (byte & 0x7f) << (index * 7);

    if ((byte & 0x80) === 0)
      return value | 0;
  }

  throw new Error("VarInt too large");
}

export function decodeVarInt(bytes: Uint8Array, offset = 0): [number, number] {
  let value = 0;

  for (let index = 0; index < 5; index++) {
    if (offset >= bytes.length)
      throw new Error("Unexpected end of packet");

    const byte = bytes[offset++]!;
    value |= (byte & 0x7f) << (index * 7);

    if ((byte & 0x80) === 0)
      return [value | 0, offset];
  }

  throw new Error("VarInt too large");
}

export function tryDecodeVarInt(bytes: Uint8Array, offset = 0): [number, number] | null {
  let value = 0;
  let currentOffset = offset;

  for (let index = 0; index < 5; index++) {
    if (currentOffset >= bytes.length)
      return null;

    const byte = bytes[currentOffset++]!;
    value |= (byte & 0x7f) << (index * 7);

    if ((byte & 0x80) === 0)
      return [value | 0, currentOffset];
  }

  throw new Error("VarInt too large");
}

export function writeVarInt(value: number, writeByte: (byte: number) => void) {
  assertIntRange("VarInt", value, INT_MIN, INT_MAX);

  let current = value >>> 0;
  while (true) {
    if ((current & ~0x7f) === 0) {
      writeByte(current);
      return;
    }

    writeByte((current & 0x7f) | 0x80);
    current >>>= 7;
  }
}

export function encodeVarInt(value: number): Uint8Array {
  const bytes: number[] = [];
  writeVarInt(value, byte => bytes.push(byte));
  return Uint8Array.from(bytes);
}

export function decodeVarLong(bytes: Uint8Array, offset = 0): [bigint, number] {
  let value = 0n;

  for (let index = 0n; index < 10n; index++) {
    if (offset >= bytes.length)
      throw new Error("Unexpected end of packet");

    const byte = BigInt(bytes[offset++]!);
    value |= (byte & 0x7fn) << (index * 7n);

    if ((byte & 0x80n) === 0n)
      return [BigInt.asIntN(64, value), offset];
  }

  throw new Error("VarLong too large");
}

export function writeVarLong(value: bigint, writeByte: (byte: number) => void) {
  assertIntRange("VarLong", value, LONG_MIN, LONG_MAX);

  let current = BigInt.asUintN(64, value);
  while (true) {
    if ((current & ~0x7fn) === 0n) {
      writeByte(Number(current));
      return;
    }

    writeByte(Number((current & 0x7fn) | 0x80n));
    current >>= 7n;
  }
}

export function encodeVarLong(value: bigint): Uint8Array {
  const bytes: number[] = [];
  writeVarLong(value, byte => bytes.push(byte));
  return Uint8Array.from(bytes);
}
