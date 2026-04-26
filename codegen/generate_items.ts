import path from "node:path";
import { getBurgerData } from "./util/burger";
import { downloadClientJar } from "./util/download";
import { getGeneratedHeader } from "./util/generated";

const itemsFile = Bun.file("packages/registry/src/builtin/items.ts");
const outputs = [getGeneratedHeader(path.relative(process.cwd(), import.meta.path))];

const clientJar = await Bun.file("tmp/client-26.1.jar").exists() ? "tmp/client-26.1.jar" : await downloadClientJar("tmp", "26.1");
const burgerData = await getBurgerData(clientJar);

outputs.push("enum ItemKind {");
for (const [key, value] of Object.entries(burgerData.items.item_fields)) {
  outputs.push(`  ${key} = "${value}",`);
}
outputs.push("}");
outputs.push("");
outputs.push("export { ItemKind };");

await Bun.write(itemsFile, outputs.join('\n'));
console.log(`Generated items.ts`);
