// https://github.com/PrismarineJS/node-minecraft-protocol/blob/master/src/datatypes/lpVec3.js

import { Vec3 } from "vec3";
import { decodeVarInt, writeVarInt } from "./varint";

const DATA_BITS_MASK = 32767;
const MAX_QUANTIZED_VALUE = 32766;
const ABS_MIN_VALUE = 3.051944088384301e-5;
const ABS_MAX_VALUE = 1.7179869183e10;

export function readLpVec3(bytes: Uint8Array, offset: number): [Vec3, number] {
  const a = bytes[offset];
  if (a == null)
    throw new Error("Unexpected end of packet");

  if (a === 0)
    return [new Vec3(0, 0, 0), offset + 1];

  const b = bytes[offset + 1];
  const c0 = bytes[offset + 2];
  const c1 = bytes[offset + 3];
  const c2 = bytes[offset + 4];
  const c3 = bytes[offset + 5];
  if (b == null || c0 == null || c1 == null || c2 == null || c3 == null)
    throw new Error("Unexpected end of packet");

  const c = c0 | (c1 << 8) | (c2 << 16) | (c3 << 24);
  const packed = (c * 65536) + (b << 8) + a;

  let scale = a & 3;
  let nextOffset = offset + 6;
  if ((a & 4) === 4) {
    const [varIntValue, varIntOffset] = decodeVarInt(bytes, nextOffset);
    scale = (varIntValue * 4) + scale;
    nextOffset = varIntOffset;
  }

  return [
    new Vec3(
      unpack(packed, 3) * scale,
      unpack(packed, 18) * scale,
      unpack(packed, 33) * scale
    ),
    nextOffset,
  ];
}

export function writeLpVec3(value: { x: number; y: number; z: number }, writeUnsignedByte: (value: number) => void, writeVarIntValue: (value: number) => void) {
  const x = sanitize(value.x);
  const y = sanitize(value.y);
  const z = sanitize(value.z);
  const max = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));

  if (max < ABS_MIN_VALUE) {
    writeUnsignedByte(0);
    return;
  }

  const scale = Math.ceil(max);
  const needsContinuation = (scale & 3) !== scale;
  const scaleByte = needsContinuation ? ((scale & 3) | 4) : (scale & 3);

  const packedX = pack(x / scale);
  const packedY = pack(y / scale);
  const packedZ = pack(z / scale);

  const low32 = (scaleByte | (packedX << 3) | (packedY << 18)) >>> 0;
  const high16 = ((packedY >> 14) & 0x01) | (packedZ << 1);

  writeUnsignedByte(low32 & 0xff);
  writeUnsignedByte((low32 >>> 8) & 0xff);
  writeUnsignedByte((low32 >>> 16) & 0xff);
  writeUnsignedByte((low32 >>> 24) & 0xff);
  writeUnsignedByte(high16 & 0xff);
  writeUnsignedByte((high16 >>> 8) & 0xff);

  if (needsContinuation)
    writeVarIntValue(Math.floor(scale / 4));
}

export function sizeOfLpVec3(value: Vec3): number {
  const max = Math.max(Math.abs(value.x), Math.abs(value.y), Math.abs(value.z));
  if (max < ABS_MIN_VALUE)
    return 1;

  const scale = Math.ceil(max);
  if ((scale & 3) !== scale) {
    let size = 6;
    writeVarInt(Math.floor(scale / 4), () => {
      size++;
    });
    return size;
  }

  return 6;
}

function sanitize(value: number): number {
  if (Number.isNaN(value))
    return 0;
  return Math.max(-ABS_MAX_VALUE, Math.min(value, ABS_MAX_VALUE));
}

function pack(value: number): number {
  return Math.round((value * 0.5 + 0.5) * MAX_QUANTIZED_VALUE);
}

function unpack(packed: number, shift: number): number {
  const value = Math.floor(packed / 2 ** shift) & DATA_BITS_MASK;
  const clamped = value > 32766 ? 32766 : value;
  return (clamped * 2) / 32766 - 1;
}
