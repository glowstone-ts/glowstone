import path from "path";
import { NbtReader } from "../src";

const bytes = await Bun.file(path.join(import.meta.dir, "bigtest.nbt")).bytes();
const decoded = NbtReader.fromGzip(bytes).read();

console.dir(decoded, { depth: null });