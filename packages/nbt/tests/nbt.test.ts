import { expect, it } from "bun:test";
import { NbtReader, NbtTagType, NbtWriter, type NbtCompound, type NbtList, type NbtTag } from "../src";
import path from "path";

it("encodes and decodes a simple tag", () => {
  const tag: NbtTag = {
    type: NbtTagType.String,
    name: "test",
    value: "hello",
  };

  const writer = new NbtWriter();
  writer.write(tag);
  const output = writer.finish();

  expect(new NbtReader(output).read()).toEqual(tag);
});

it("read the test bigtest.nbt file", async () => {
  const bytes = await Bun.file(path.join(import.meta.dir, "bigtest.nbt")).bytes();
  const decoded = NbtReader.fromGzip(bytes).read();

  expect(decoded.type).toBe(NbtTagType.Compound);
  expect(decoded.name).toBe("Level");
  expect(decoded.value).toBeTypeOf("object");

  expect(decoded.value).toHaveProperty("longTest");
  expect((decoded.value as NbtCompound).longTest).toBe(9223372036854775807n);

  expect(decoded.value).toHaveProperty("shortTest");
  expect((decoded.value as NbtCompound).shortTest).toBe(32767);

  expect(decoded.value).toHaveProperty("stringTest");
  expect((decoded.value as NbtCompound).stringTest).toBe("HELLO WORLD THIS IS A TEST STRING ÅÄÖ!");

  expect(decoded.value).toHaveProperty("floatTest");
  expect((decoded.value as NbtCompound).floatTest).toBe(0.4982314705848694);

  expect(decoded.value).toHaveProperty("intTest");
  expect((decoded.value as NbtCompound).intTest).toBe(2147483647);

  type nestedCompoundTest = { [something: string]: { name: string, value: number } };
  expect(decoded.value).toHaveProperty("nested compound test");
  expect((decoded.value as NbtCompound)["nested compound test"]).toHaveProperty("ham");
  expect(((decoded.value as NbtCompound)["nested compound test"] as nestedCompoundTest).ham).toHaveProperty("name");
  expect(((decoded.value as NbtCompound)["nested compound test"] as nestedCompoundTest).ham).toHaveProperty("value");
  expect(((decoded.value as NbtCompound)["nested compound test"] as nestedCompoundTest).ham!.name).toBe("Hampus");
  expect(((decoded.value as NbtCompound)["nested compound test"] as nestedCompoundTest).ham!.value).toBe(0.75);
  expect((decoded.value as NbtCompound)["nested compound test"]).toHaveProperty("egg");
  expect(((decoded.value as NbtCompound)["nested compound test"] as nestedCompoundTest).egg).toHaveProperty("name");
  expect(((decoded.value as NbtCompound)["nested compound test"] as nestedCompoundTest).egg).toHaveProperty("value");
  expect(((decoded.value as NbtCompound)["nested compound test"] as nestedCompoundTest).egg!.name).toBe("Eggbert");
  expect(((decoded.value as NbtCompound)["nested compound test"] as nestedCompoundTest).egg!.value).toBe(0.5);

  expect(decoded.value).toHaveProperty("listTest (long)");
  expect((decoded.value as NbtCompound)["listTest (long)"]).toBeTypeOf("object");
  expect((decoded.value as NbtCompound)["listTest (long)"]).toHaveProperty("elementType");
  expect(((decoded.value as NbtCompound)["listTest (long)"] as NbtList).elementType).toBe(NbtTagType.Long);
  expect((decoded.value as NbtCompound)["listTest (long)"]).toHaveProperty("items");
  expect(((decoded.value as NbtCompound)["listTest (long)"] as NbtList).items).toBeInstanceOf(Array);
  expect(((decoded.value as NbtCompound)["listTest (long)"] as NbtList).items).toHaveLength(5);
  for (const [index, item] of ((decoded.value as NbtCompound)["listTest (long)"] as NbtList).items.entries()) {
    expect(item).toBeTypeOf("bigint");
    expect(item).toBe(11n + BigInt(index));
  }

  expect(decoded.value).toHaveProperty("listTest (compound)");
  expect((decoded.value as NbtCompound)["listTest (compound)"]).toBeTypeOf("object");
  expect((decoded.value as NbtCompound)["listTest (compound)"]).toHaveProperty("elementType");
  expect(((decoded.value as NbtCompound)["listTest (compound)"] as NbtList).elementType).toBe(NbtTagType.Compound);
  expect((decoded.value as NbtCompound)["listTest (compound)"]).toHaveProperty("items");
  expect(((decoded.value as NbtCompound)["listTest (compound)"] as NbtList).items).toBeInstanceOf(Array);
  expect(((decoded.value as NbtCompound)["listTest (compound)"] as NbtList).items).toHaveLength(2);
  for (const [index, item] of ((decoded.value as NbtCompound)["listTest (compound)"] as NbtList).items.entries()) {
    expect(item).toBeTypeOf("object");
    expect(item).toHaveProperty("name");
    expect((item as NbtCompound)['name']).toBeTypeOf("string");
    expect((item as NbtCompound)['name']).toBe("Compound tag #" + index);
    expect(item).toHaveProperty("created-on");
    expect((item as NbtCompound)['created-on']).toBeTypeOf("bigint");
    expect((item as NbtCompound)['created-on']).toBe(1264099775885n);
  }

  expect(decoded.value).toHaveProperty("byteTest");
  expect((decoded.value as NbtCompound).byteTest).toBe(127);

  expect(decoded.value).toHaveProperty(["byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))"]);
  expect((decoded.value as NbtCompound)["byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))"]).toBeInstanceOf(Uint8Array);
  expect((decoded.value as NbtCompound)["byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))"]).toHaveLength(1000);
  for (let n = 0; n < 1000; n++) {
    expect(((decoded.value as NbtCompound)["byteArrayTest (the first 1000 values of (n*n*255+n*7)%100, starting with n=0 (0, 62, 34, 16, 8, ...))"] as Uint8Array)[n]).toBe((n * n * 255 + n * 7) % 100);
  }

  expect(decoded.value).toHaveProperty("doubleTest");
  expect((decoded.value as NbtCompound).doubleTest).toBe(0.4931287132182315);
})
