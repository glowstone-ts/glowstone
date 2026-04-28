export enum NbtTagType {
  End = 0,
  Byte = 1,
  Short = 2,
  Int = 3,
  Long = 4,
  Float = 5,
  Double = 6,
  ByteArray = 7,
  String = 8,
  List = 9,
  Compound = 10,
  IntArray = 11,
  LongArray = 12,
}

export interface NbtList {
  elementType: NbtTagType;
  items: NbtValue[];
}

export interface NbtCompound {
  [key: string]: NbtValue;
}

export type NbtValue = number | bigint | string | Uint8Array | NbtList | NbtCompound | number[] | bigint[];

export interface NbtTag {
  type: Exclude<NbtTagType, NbtTagType.End>;
  name: string;
  value: NbtValue;
}
