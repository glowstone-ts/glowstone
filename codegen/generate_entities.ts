import path from "node:path";
import { getBurgerData } from "./util/burger";
import { downloadClientJar } from "./util/download";
import { getGeneratedHeader } from "./util/generated";

const entitiesFile = Bun.file("packages/registry/src/builtin/entities.ts");
const outputs = [getGeneratedHeader(path.relative(process.cwd(), import.meta.path))];

const clientJar = await Bun.file("tmp/client-26.1.jar").exists() ? "tmp/client-26.1.jar" : await downloadClientJar("tmp", "26.1");
const burgerData = await getBurgerData(clientJar);

outputs.push("enum EntityKind {");
// seems like there are abstract entities that start with ~
for (const [key, value] of Object.entries(burgerData.entities.entity).filter(([k, v]) => !k.startsWith("~")) as [string, any][]) {
  outputs.push(`  ${value.field} = "${key}",`);
}
outputs.push("}");
outputs.push("");
outputs.push("export { EntityKind };");

await Bun.write(entitiesFile, outputs.join('\n'));
console.log(`Generated entities.ts`);
