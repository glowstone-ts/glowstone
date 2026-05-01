// tests were made by MC Helper (Discord Bot) in https://discord.gg/6TA4bsnu9V by GenerelSchwerz

import { expect, it, describe } from "bun:test";
import { NbtReader, NbtTagType, NbtWriter, type NbtCompound, type NbtList, type NbtTag } from "../src";
import path from "path";

function roundTrip(tag: NbtTag): NbtTag {
  const writer = new NbtWriter();
  writer.write(tag);
  const bytes = writer.finish();
  const reader = new NbtReader(bytes);
  return reader.read();
}

function makeCompound(entries: Record<string, NbtTag["value"]>): NbtTag {
  const value: NbtCompound = {};
  for (const [k, v] of Object.entries(entries)) {
    value[k] = v;
  }
  return { type: NbtTagType.Compound, name: "", value };
}

describe("roundtrip", () => {
  it("encodes and decodes a simple string tag", () => {
    const tag: NbtTag = { type: NbtTagType.String, name: "greeting", value: "hello" };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes a byte tag", () => {
    const tag: NbtTag = { type: NbtTagType.Byte, name: "b", value: 42 };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes a short tag", () => {
    const tag: NbtTag = { type: NbtTagType.Short, name: "s", value: -12345 };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes an int tag", () => {
    const tag: NbtTag = { type: NbtTagType.Int, name: "i", value: 2147483647 };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes a long tag", () => {
    const tag: NbtTag = { type: NbtTagType.Long, name: "l", value: 9223372036854775807n };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes a float tag", () => {
    const tag: NbtTag = { type: NbtTagType.Float, name: "f", value: 3.141592653589793 };
    expect(roundTrip(tag).value).toBeCloseTo(tag.value as number, 5);
  });

  it("encodes and decodes a double tag", () => {
    const tag: NbtTag = { type: NbtTagType.Double, name: "d", value: 2.718281828459045 };
    expect(roundTrip(tag).value).toBeCloseTo(tag.value as number, 10);
  });

  it("encodes and decodes a byte array tag", () => {
    const tag: NbtTag = { type: NbtTagType.ByteArray, name: "ba", value: new Uint8Array([0, 1, 2, 254, 255]) };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes an empty byte array", () => {
    const tag: NbtTag = { type: NbtTagType.ByteArray, name: "empty", value: new Uint8Array([]) };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes an int array tag", () => {
    const tag: NbtTag = { type: NbtTagType.IntArray, name: "ia", value: [0, -1, 1000000, 2147483647, -2147483648] };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes an empty int array", () => {
    const tag: NbtTag = { type: NbtTagType.IntArray, name: "empty", value: [] };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes a long array tag", () => {
    const tag: NbtTag = { type: NbtTagType.LongArray, name: "la", value: [0n, -1n, 9223372036854775807n] };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("encodes and decodes an empty long array", () => {
    const tag: NbtTag = { type: NbtTagType.LongArray, name: "empty", value: [] };
    expect(roundTrip(tag)).toEqual(tag);
  });
});

describe("list roundtrip", () => {
  it("list of bytes", () => {
    const list: NbtList = { elementType: NbtTagType.Byte, items: [1, 2, 3] };
    const tag: NbtTag = { type: NbtTagType.List, name: "lb", value: list };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("empty list (elementType TagEnd)", () => {
    const list: NbtList = { elementType: NbtTagType.End, items: [] };
    const tag: NbtTag = { type: NbtTagType.List, name: "empty", value: list };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("list of strings", () => {
    const list: NbtList = { elementType: NbtTagType.String, items: ["a", "b", ""] };
    const tag: NbtTag = { type: NbtTagType.List, name: "ls", value: list };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("list of compounds", () => {
    const list: NbtList = {
      elementType: NbtTagType.Compound,
      items: [
        { n: "foo" },
        { n: "bar", extra: 42 }
      ]
    };
    const tag: NbtTag = { type: NbtTagType.List, name: "lc", value: list };
    const decoded = roundTrip(tag);
    expect(decoded.type).toBe(NbtTagType.List);
    const v = decoded.value as NbtList;
    expect(v.elementType).toBe(NbtTagType.Compound);
    expect(v.items).toHaveLength(2);
    expect((v.items[0] as NbtCompound).n).toBe("foo");
    expect((v.items[1] as NbtCompound).extra).toBe(42);
  });
});

describe("compound roundtrip", () => {
  it("empty compound", () => {
    const tag: NbtTag = { type: NbtTagType.Compound, name: "empty", value: {} };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("simple compound with multiple types", () => {
    const tag = makeCompound({
      byte: 127,
      short: -1,
      int: 1000,
      long: 1234567890123n,
      float: 0.5,
      double: 1.0e-10,
      str: "测试",
      ba: new Uint8Array([10, 20]),
    });
    tag.name = "root";
    const decoded = roundTrip(tag);
    expect(decoded).toEqual(tag);
  });

  it("deeply nested compounds", () => {
    const inner: NbtCompound = { x: { y: { z: 1 } } };
    const tag: NbtTag = { type: NbtTagType.Compound, name: "deep", value: inner };
    const decoded = roundTrip(tag);
    const v = decoded.value as NbtCompound;
    expect((v.x as NbtCompound).y as NbtCompound).toHaveProperty("z");
    expect(((v.x as NbtCompound).y as NbtCompound).z).toBe(1);
  });

  it("compound with list and array children", () => {
    const tag = makeCompound({
      list: { elementType: NbtTagType.Int, items: [5, 6, 7] } as NbtList,
      bytes: new Uint8Array([255, 0]),
    });
    tag.name = "mixed";
    const decoded = roundTrip(tag);
    const v = decoded.value as NbtCompound;
    expect((v.list as NbtList).items).toEqual([5, 6, 7]);
    expect(v.bytes).toEqual(new Uint8Array([255, 0]));
  });
});

describe("edge cases", () => {
  it("very long string", () => {
    const longStr = "a".repeat(65535);
    const tag: NbtTag = { type: NbtTagType.String, name: "long", value: longStr };
    expect(roundTrip(tag).value).toBe(longStr);
  });

  it("unicode string", () => {
    const tag: NbtTag = { type: NbtTagType.String, name: "uni", value: "こんにちは世界 🌍" };
    expect(roundTrip(tag)).toEqual(tag);
  });

  it("negative byte", () => {
    const tag: NbtTag = { type: NbtTagType.Byte, name: "neg", value: -128 };
    expect(roundTrip(tag).value).toBe(-128);
  });

  it("zero values", () => {
    const tag = makeCompound({
      byte: 0,
      short: 0,
      int: 0,
      long: 0n,
      float: 0,
      double: 0,
      str: "",
    });
    tag.name = "zeros";
    expect(roundTrip(tag)).toEqual(tag);
  });
});

describe("error handling", () => {
  it("throws on truncated data", () => {
    const writer = new NbtWriter();
    writer.write({ type: NbtTagType.String, name: "x", value: "hello" });
    const bytes = writer.finish();
    const truncated = bytes.slice(0, bytes.length - 3);
    expect(() => new NbtReader(truncated).read()).toThrow();
  });

  it("throws on empty buffer", () => {
    expect(() => new NbtReader(new Uint8Array([])).read()).toThrow();
  });

  it("throws on invalid tag type byte", () => {
    const buf = new Uint8Array([0xFF, 0x00, 0x01]);
    expect(() => new NbtReader(buf).read()).toThrow();
  });
});

describe("bigtest.nbt", () => {
  it("read the test bigtest.nbt file", async () => {
    const bytes = await Bun.file(path.join(import.meta.dir, "bigtest.nbt")).bytes();
    const decoded = NbtReader.fromGzip(bytes).read();

    expect(decoded.type).toBe(NbtTagType.Compound);
    expect(decoded.name).toBe("Level");
    expect(decoded.value).toBeTypeOf("object");

    const v = decoded.value as NbtCompound;

    expect(v.longTest).toBe(9223372036854775807n);
    expect(v.shortTest).toBe(32767);
    expect(v.stringTest).toBe("HELLO WORLD THIS IS A TEST STRING ÅÄÖ!");
    expect(v.floatTest).toBeCloseTo(0.4982314705848694, 5);
    expect(v.intTest).toBe(2147483647);

    const nested = v["nested compound test"] as NbtCompound;
    expect(nested).toBeDefined();
    expect((nested.ham as NbtCompound).name).toBe("Hampus");
    expect((nested.ham as NbtCompound).value).toBeCloseTo(0.75, 5);
    expect((nested.egg as NbtCompound).name).toBe("Eggbert");
    expect((nested.egg as NbtCompound).value).toBeCloseTo(0.5, 5);

    const longList = v["listTest (long)"] as NbtList;
    expect(longList.elementType).toBe(NbtTagType.Long);
    expect(longList.items).toHaveLength(5);
    for (let i = 0; i < 5; i++) {
      expect(longList.items[i]).toBe(11n + BigInt(i));
    }

    const compoundList = v["listTest (compound)"] as NbtList;
    expect(compoundList.elementType).toBe(NbtTagType.Compound);
    expect(compoundList.items).toHaveLength(2);
    for (let i = 0; i < 2; i++) {
      const item = compoundList.items[i] as NbtCompound;
      expect(item.name).toBe("Compound tag #" + i);
      expect(item["created-on"]).toBe(1264099775885n);
    }

    const key = "byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))";
    const byteArray = v[key] as Uint8Array;
    expect(byteArray).toBeInstanceOf(Uint8Array);
    expect(byteArray).toHaveLength(1000);
    for (let n = 0; n < 1000; n++) {
      expect(byteArray[n]).toBe((n * n * 255 + n * 7) % 100);
    }

    expect(v.doubleTest).toBeCloseTo(0.4931287132182315, 10);
    expect(v.byteTest).toBe(127);
  });
});