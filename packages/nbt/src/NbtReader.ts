import { gunzipSync, inflateSync } from "node:zlib";
import { NbtTagType, type NbtCompound, type NbtList, type NbtTag, type NbtValue } from "./types";

const textDecoder = new TextDecoder();

export class NbtReader {
  offset = 0;

  constructor(readonly bytes: Uint8Array) {}

  static fromGzip(bytes: Uint8Array): NbtReader {
    return new NbtReader(toUint8Array(gunzipSync(bytes)));
  }

  static fromZlib(bytes: Uint8Array): NbtReader {
    return new NbtReader(toUint8Array(inflateSync(bytes)));
  }

  clone(): NbtReader {
    const clone = new NbtReader(this.bytes);
    clone.offset = this.offset;
    return clone;
  }

  get remaining(): number {
    return this.bytes.length - this.offset;
  }

  read(): NbtTag {
    const type = this.readTagType();
    if (type === NbtTagType.End)
      throw new Error("Root NBT tag can't be TAG_End");

    const name = this.readString();
    const value = this.readPayload(type);
    return { type, name, value };
  }

  readPayload(type: Exclude<NbtTagType, NbtTagType.End>): NbtValue {
    switch (type) {
      case NbtTagType.Byte:
        return this.readByte();
      case NbtTagType.Short:
        return this.readShort();
      case NbtTagType.Int:
        return this.readInt();
      case NbtTagType.Long:
        return this.readLong();
      case NbtTagType.Float:
        return this.readFloat();
      case NbtTagType.Double:
        return this.readDouble();
      case NbtTagType.ByteArray:
        return this.readByteArray();
      case NbtTagType.String:
        return this.readString();
      case NbtTagType.List:
        return this.readList();
      case NbtTagType.Compound:
        return this.readCompound();
      case NbtTagType.IntArray:
        return this.readIntArray();
      case NbtTagType.LongArray:
        return this.readLongArray();
    }
  }

  private readCompound(): NbtCompound {
    const compound: NbtCompound = {};

    while (true) {
      const type = this.readTagType();
      if (type === NbtTagType.End)
        return compound;

      const name = this.readString();
      compound[name] = this.readPayload(type);
    }
  }

  private readList(): NbtList {
    const elementType = this.readTagType();
    const length = this.readLength("TAG_List");
    const items = Array.from({ length }, () => {
      if (elementType === NbtTagType.End)
        throw new Error("TAG_List can't contain TAG_End elements");
      return this.readPayload(elementType);
    });

    return { elementType, items };
  }

  private readByteArray(): Uint8Array {
    return this.readBytes(this.readLength("TAG_Byte_Array"));
  }

  private readIntArray(): number[] {
    const length = this.readLength("TAG_Int_Array");
    return Array.from({ length }, () => this.readInt());
  }

  private readLongArray(): bigint[] {
    const length = this.readLength("TAG_Long_Array");
    return Array.from({ length }, () => this.readLong());
  }

  private readLength(tagName: string): number {
    const length = this.readInt();
    if (length < 0)
      throw new Error(`${tagName} length can't be negative: ${length}`);
    return length;
  }

  private readTagType(): NbtTagType {
    const type = this.readUnsignedByte();
    if (!(type in NbtTagType))
      throw new Error(`Don't know NBT tag type ${type}`);
    return type as NbtTagType;
  }

  private readByte(): number {
    const value = this.readUnsignedByte();
    return value > 127 ? value - 256 : value;
  }

  private readUnsignedByte(): number {
    if (this.remaining < 1)
      throw new Error("NBT data ended too early");
    return this.bytes[this.offset++]!;
  }

  private readShort(): number {
    const value = (this.readUnsignedByte() << 8) | this.readUnsignedByte();
    return value & 0x8000 ? value - 0x10000 : value;
  }

  private readInt(): number {
    return (
      (this.readUnsignedByte() << 24) |
      (this.readUnsignedByte() << 16) |
      (this.readUnsignedByte() << 8) |
      this.readUnsignedByte()
    );
  }

  private readLong(): bigint {
    let value = 0n;
    for (let index = 0; index < 8; index++)
      value = (value << 8n) | BigInt(this.readUnsignedByte());

    return value & 0x8000000000000000n
      ? value - 0x10000000000000000n
      : value;
  }

  private readFloat(): number {
    const bytes = this.readBytes(4);
    return new DataView(bytes.buffer, bytes.byteOffset, 4).getFloat32(0, false);
  }

  private readDouble(): number {
    const bytes = this.readBytes(8);
    return new DataView(bytes.buffer, bytes.byteOffset, 8).getFloat64(0, false);
  }

  private readString(): string {
    const length = this.readUnsignedShort();
    return textDecoder.decode(this.readBytes(length));
  }

  private readUnsignedShort(): number {
    return (this.readUnsignedByte() << 8) | this.readUnsignedByte();
  }

  private readBytes(length: number): Uint8Array {
    if (length < 0)
      throw new Error(`Byte length is weird: ${length}`);
    if (this.remaining < length)
      throw new Error("NBT data ended too early");

    const value = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }
}

function toUint8Array(bytes: Uint8Array): Uint8Array {
  return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
