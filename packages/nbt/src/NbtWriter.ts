import { deflateSync, gzipSync } from "node:zlib";
import { NbtTagType, type NbtCompound, type NbtList, type NbtTag, type NbtValue } from "./types";

const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const LONG_MIN = -(1n << 63n);
const LONG_MAX = (1n << 63n) - 1n;
const textEncoder = new TextEncoder();

export class NbtWriter {
  private readonly chunks: number[] = [];

  write(tag: NbtTag) {
    this.writeUnsignedByte(tag.type);
    this.writeString(tag.name);
    this.writePayload(tag.type, tag.value);
  }

  writePayload(type: Exclude<NbtTagType, NbtTagType.End>, value: NbtValue) {
    switch (type) {
      case NbtTagType.Byte:
        return this.writeByte(assertNumber(type, value));
      case NbtTagType.Short:
        return this.writeShort(assertNumber(type, value));
      case NbtTagType.Int:
        return this.writeInt(assertNumber(type, value));
      case NbtTagType.Long:
        return this.writeLong(assertBigInt(type, value));
      case NbtTagType.Float:
        return this.writeFloat(assertNumber(type, value));
      case NbtTagType.Double:
        return this.writeDouble(assertNumber(type, value));
      case NbtTagType.ByteArray:
        return this.writeByteArray(assertUint8Array(type, value));
      case NbtTagType.String:
        return this.writeString(assertString(type, value));
      case NbtTagType.List:
        return this.writeList(assertList(type, value));
      case NbtTagType.Compound:
        return this.writeCompound(assertCompound(type, value));
      case NbtTagType.IntArray:
        return this.writeIntArray(assertNumberArray(type, value));
      case NbtTagType.LongArray:
        return this.writeLongArray(assertBigIntArray(type, value));
    }
  }

  finish(): Uint8Array {
    return Uint8Array.from(this.chunks);
  }

  finishGzip(): Uint8Array {
    return toUint8Array(gzipSync(this.finish()));
  }

  finishZlib(): Uint8Array {
    return toUint8Array(deflateSync(this.finish()));
  }

  private writeCompound(value: NbtCompound) {
    for (const [name, entry] of Object.entries(value)) {
      const type = getTagType(entry);
      if (type === NbtTagType.End)
        throw new Error(`Couldn't get TAG_End right for compound entry "${name}"`);

      this.writeUnsignedByte(type);
      this.writeString(name);
      this.writePayload(type, entry);
    }

    this.writeUnsignedByte(NbtTagType.End);
  }

  private writeList(value: NbtList) {
    this.writeUnsignedByte(value.elementType);
    this.writeInt(value.items.length);

    for (const item of value.items) {
      if (value.elementType === NbtTagType.End)
        throw new Error("TAG_List can't use TAG_End for its element type");

      assertListItemType(value.elementType, item);
      this.writePayload(value.elementType, item);
    }
  }

  private writeByteArray(value: Uint8Array) {
    this.writeInt(value.length);
    this.writeBytes(value);
  }

  private writeIntArray(value: number[]) {
    this.writeInt(value.length);
    for (const entry of value)
      this.writeInt(entry);
  }

  private writeLongArray(value: bigint[]) {
    this.writeInt(value.length);
    for (const entry of value)
      this.writeLong(entry);
  }

  private writeByte(value: number) {
    this.range("TAG_Byte", value, -128, 127);
    this.chunks.push(value & 0xff);
  }

  private writeUnsignedByte(value: number) {
    this.range("UnsignedByte", value, 0, 255);
    this.chunks.push(value);
  }

  private writeShort(value: number) {
    this.range("TAG_Short", value, -32768, 32767);
    this.chunks.push((value >>> 8) & 0xff, value & 0xff);
  }

  private writeInt(value: number) {
    this.range("TAG_Int", value, INT_MIN, INT_MAX);
    this.chunks.push(
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff,
    );
  }

  private writeLong(value: bigint) {
    this.range("TAG_Long", value, LONG_MIN, LONG_MAX);
    for (let shift = 56n; shift >= 0n; shift -= 8n)
      this.chunks.push(Number((value >> shift) & 0xffn));
  }

  private writeFloat(value: number) {
    if (!Number.isFinite(value))
      throw new Error("TAG_Float must be finite");

    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setFloat32(0, value, false);
    this.writeBytes(new Uint8Array(buffer));
  }

  private writeDouble(value: number) {
    if (!Number.isFinite(value))
      throw new Error("TAG_Double must be finite");

    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setFloat64(0, value, false);
    this.writeBytes(new Uint8Array(buffer));
  }

  private writeString(value: string) {
    const bytes = textEncoder.encode(value);
    this.range("TAG_String length", bytes.length, 0, 65535);
    this.chunks.push((bytes.length >>> 8) & 0xff, bytes.length & 0xff);
    this.writeBytes(bytes);
  }

  private writeBytes(value: Uint8Array) {
    for (const byte of value)
      this.chunks.push(byte);
  }

  private range(name: string, value: number | bigint, min: number | bigint, max: number | bigint) {
    if (value < min || value > max)
      throw new Error(`${name} doesn't fit in range (${min} - ${max}): ${value}`);
  }
}

function assertNumber(type: NbtTagType, value: NbtValue): number {
  if (typeof value !== "number")
    throw new Error(`Tag type ${type} wanted a number but didn't get one`);
  return value;
}

function assertBigInt(type: NbtTagType, value: NbtValue): bigint {
  if (typeof value !== "bigint")
    throw new Error(`Tag type ${type} wanted a bigint but didn't get one`);
  return value;
}

function assertString(type: NbtTagType, value: NbtValue): string {
  if (typeof value !== "string")
    throw new Error(`Tag type ${type} wanted a string but didn't get one`);
  return value;
}

function assertUint8Array(type: NbtTagType, value: NbtValue): Uint8Array {
  if (!(value instanceof Uint8Array))
    throw new Error(`Tag type ${type} wanted a Uint8Array but didn't get one`);
  return value;
}

function assertList(type: NbtTagType, value: NbtValue): NbtList {
  if (typeof value !== "object" || value == null || !("elementType" in value) || !("items" in value))
    throw new Error(`Tag type ${type} wanted a list thing but didn't get one`);
  return value as NbtList;
}

function assertCompound(type: NbtTagType, value: NbtValue): NbtCompound {
  if (typeof value !== "object" || value == null || Array.isArray(value) || value instanceof Uint8Array || "elementType" in value)
    throw new Error(`Tag type ${type} wanted a compound thing but didn't get one`);
  return value as NbtCompound;
}

function assertNumberArray(type: NbtTagType, value: NbtValue): number[] {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== "number"))
    throw new Error(`Tag type ${type} wanted number[] but didn't get it`);
  return value as number[];
}

function assertBigIntArray(type: NbtTagType, value: NbtValue): bigint[] {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== "bigint"))
    throw new Error(`Tag type ${type} wanted bigint[] but didn't get it`);
  return value as bigint[];
}

function getTagType(value: NbtValue): NbtTagType {
  if (typeof value === "number")
    return NbtTagType.Int;
  if (typeof value === "bigint")
    return NbtTagType.Long;
  if (typeof value === "string")
    return NbtTagType.String;
  if (value instanceof Uint8Array)
    return NbtTagType.ByteArray;
  if (Array.isArray(value)) {
    if (value.every(entry => typeof entry === "number"))
      return NbtTagType.IntArray;
    if (value.every(entry => typeof entry === "bigint"))
      return NbtTagType.LongArray;
  }
  if (typeof value === "object" && value != null) {
    if ("elementType" in value && "items" in value)
      return NbtTagType.List;
    return NbtTagType.Compound;
  }

  throw new Error(`Couldn't get NBT tag type for value: ${String(value)}`);
}

function assertListItemType(expectedType: NbtTagType, value: NbtValue) {
  switch (expectedType) {
    case NbtTagType.Byte:
    case NbtTagType.Short:
    case NbtTagType.Int:
    case NbtTagType.Float:
    case NbtTagType.Double:
      if (typeof value !== "number")
        throw new Error(`TAG_List element type doesn't match, wanted number for type ${expectedType}`);
      return;
    case NbtTagType.Long:
      if (typeof value !== "bigint")
        throw new Error("TAG_List element type doesn't match, wanted bigint for TAG_Long");
      return;
    case NbtTagType.String:
      if (typeof value !== "string")
        throw new Error("TAG_List element type doesn't match, wanted string for TAG_String");
      return;
    case NbtTagType.ByteArray:
      if (!(value instanceof Uint8Array))
        throw new Error("TAG_List element type doesn't match, wanted Uint8Array for TAG_Byte_Array");
      return;
    case NbtTagType.List:
      if (typeof value !== "object" || value == null || !("elementType" in value) || !("items" in value))
        throw new Error("TAG_List element type doesn't match, wanted nested list for TAG_List");
      return;
    case NbtTagType.Compound:
      assertCompound(NbtTagType.Compound, value);
      return;
    case NbtTagType.IntArray:
      assertNumberArray(NbtTagType.IntArray, value);
      return;
    case NbtTagType.LongArray:
      assertBigIntArray(NbtTagType.LongArray, value);
      return;
    case NbtTagType.End:
      throw new Error("TAG_List can't use TAG_End for its element type");
  }
}

function toUint8Array(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
